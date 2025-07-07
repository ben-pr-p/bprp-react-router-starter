import { SCHEMA } from "@/database/db.server";
import {
  startPgGatewayServer,
  stopPgGatewayServer,
} from "@/database/pg.server";
import { MIGRATIONS_FOLDER } from "@/constants";
import { watch } from "graphile-migrate";
import kanel from "kanel";
import kanelKysely from "kanel-kysely";
import camelCase from "lodash/camelCase";
import capitalize from "lodash/capitalize";
import { pgDump } from "@electric-sql/pglite-tools/pg_dump";
import { PGlite } from "@electric-sql/pglite";
import { writeFile } from "fs/promises";

/**
 * Using pgDump
 *
 * const dump = await pgDump({ pg })
 * const dumpContent = await dump.text()
 */

const { processDatabase } = kanel;
const { makeKyselyHook } = kanelKysely;

async function runMigrations(connectionString: string) {
  await watch(
    {
      connectionString,
      migrationsFolder: MIGRATIONS_FOLDER,
    },
    // true for once (run and done)
    true
  );
}

const makeConfig = (connectionString: string) => ({
  schemas: [SCHEMA],
  outputPath: "./app/database/types",
  preRenderHooks: [makeKyselyHook()],
  connection: {
    connectionString,
  },
  // This implementation will generate flavored instead of branded types.
  // See: https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/
  generateIdentifierType: (c: any, d: any) => {
    const pascalTableName = capitalize(camelCase(d.name));
    const pascalColumnName = capitalize(camelCase(c.name));

    return {
      declarationType: "typeDeclaration" as const,
      name: `${pascalTableName}${pascalColumnName}`,
      exportAs: "named" as const,
      typeDefinition: [
        // `string & { __flavor?: '${pascalTableName}${pascalColumnName}' }`,
        "string",
      ],
      comment: [`Identifier type for ${d.name}`],
    };
  },
});

async function dumpDatabase(pg: PGlite) {
  const dump = await pgDump({ pg });
  const dumpContent = await dump.text();

  await writeFile("./db-dump.sql", dumpContent);

  return dumpContent;
}

async function main() {
  const { server, connectionString, pg } = await startPgGatewayServer();
  await runMigrations(connectionString);
  const processDatabasePromise = processDatabase(makeConfig(connectionString));
  const pgDumpPromise = dumpDatabase(pg);
  await Promise.all([processDatabasePromise, pgDumpPromise]);
  await stopPgGatewayServer(server);
}

main();
