import { config } from "@/config";
import { Kysely, PostgresDialect, WithSchemaPlugin } from "kysely";
import { getIsolatedTestPool, getPool } from "./pg.server";
import { idempotentlyRunSeedsWithinProcess } from "./seeds.server";
import type Database from "./types/Database";

export const SCHEMA = "widgets";

export async function getKysely({
  runSeeds = config.isDev,
}: { runSeeds?: boolean } = {}) {
  const { pool } = await getPool();

  const db = new Kysely<Database>({
    plugins: [new WithSchemaPlugin(SCHEMA)],
    dialect: new PostgresDialect({
      pool,
    }),
  });

  if (runSeeds) {
    await idempotentlyRunSeedsWithinProcess(db);
  }

  return db;
}

export async function getIsolatedTestKysely({
  runSeeds = false,
}: { runSeeds?: boolean } = {}) {
  const { pool, stop } = await getIsolatedTestPool();
  const db = new Kysely<Database>({
    plugins: [new WithSchemaPlugin(SCHEMA)],
    dialect: new PostgresDialect({
      pool,
    }),
  });

  if (runSeeds) {
    await idempotentlyRunSeedsWithinProcess(db);
  }

  return { db, stop, pool };
}
