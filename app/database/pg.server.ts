import net from "node:net";
import { config } from "@/config";
import { MIGRATIONS_FOLDER } from "@/constants";
import log from "@/lib/log";
import { PGlite } from "@electric-sql/pglite";
import { migrate, watch } from "graphile-migrate";
import pg from "pg";
import type { Pool as PoolType } from "pg";
import { fromNodeSocket } from "pg-gateway/node";
import invariant from "tiny-invariant";

const { Pool } = pg;

type GetPoolResult = {
  pool: PoolType;
  stop: () => void;
};

let poolPromise: Promise<GetPoolResult> | null = null;

export async function getPool(): Promise<GetPoolResult> {
  if (poolPromise) {
    return poolPromise;
  }

  if (config.isProd) {
    poolPromise = (async () => {
      // Return a real migrated database
      const pool = new Pool({ connectionString: config.DATABASE_URL });

      await migrate({
        connectionString: config.DATABASE_URL,
        migrationsFolder: MIGRATIONS_FOLDER,
      });

      return {
        pool,
        stop: () => {
          invariant(pool, "Pool is not initialized");
          pool.end();
        },
      };
    })();

    return poolPromise;
  }

  // Dev case - if confnig.DATABASE_URL is not set, we use the pg-gateway server
  if (config.DATABASE_URL) {
    poolPromise = (async () => {
      const pool = new Pool({ connectionString: config.DATABASE_URL });
      return { pool, stop: () => pool.end() };
    })();

    return poolPromise;
  } else {
    poolPromise = (async () => {
      const { server, connectionString } = await startPgGatewayServer();
      console.log("connectionString", connectionString);
      const pool = new Pool({ connectionString });

      await watch(
        {
          connectionString,
          migrationsFolder: MIGRATIONS_FOLDER,
        },
        // true for once (run and done)
        true
      );

      return {
        pool,
        stop: () => stopPgGatewayServer(server),
      };
    })();

    return poolPromise;
  }

  throw new Error("Unhandled case");
}

export async function startPgGatewayServer() {
  const db = await PGlite.create();
  const server = net.createServer(async (socket) => {
    await fromNodeSocket(socket, {
      serverVersion: "16.3",

      auth: {
        // No password required
        method: "trust",
      },

      async onStartup() {
        // Wait for PGlite to be ready before further processing
        await db.waitReady;
      },

      // Hook into each client message
      async onMessage(data, { isAuthenticated }) {
        // Only forward messages to PGlite after authentication
        if (!isAuthenticated) {
          return;
        }

        // Forward raw message to PGlite and send response to client
        return await db.execProtocolRaw(data);
      },
    });

    socket.on("end", () => {
      log.info("Client disconnected");
    });
  });

  return new Promise<{
    server: net.Server;
    port: number;
    connectionString: string;
    pg: PGlite;
  }>((resolve) =>
    server.listen(0, () => {
      const serverAddress = server.address();
      invariant(serverAddress, "Server address is undefined");
      invariant(
        typeof serverAddress !== "string",
        "Server address is a string, not an AddressInfo"
      );
      invariant(serverAddress.port, "Server address port is undefined");
      resolve({
        server,
        port: serverAddress.port,
        pg: db,
        connectionString: `postgres://postgres:postgres@localhost:${serverAddress.port}/postgres`,
      });
    })
  );
}

export function stopPgGatewayServer(server: net.Server) {
  server.close();
}

export async function getIsolatedTestPool() {
  const { server, connectionString } = await startPgGatewayServer();
  const pool = new Pool({ connectionString });
  await watch(
    {
      connectionString,
      migrationsFolder: MIGRATIONS_FOLDER,
    },
    // true for once (run and done)
    true
  );

  return { pool, stop: () => stopPgGatewayServer(server) };
}
