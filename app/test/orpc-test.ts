import { createRouterClient } from "@orpc/server";
import { router } from "@/orpc/router.server";
import { getIsolatedTestKysely } from "@/database/db.server";
import { test, type Pool } from "vitest";
import type { Kysely } from "node_modules/kysely/dist/esm/kysely";
import type Database from "@/database/types/Database";

export async function getTestRouterClient({
  runSeeds = false,
}: { runSeeds?: boolean } = {}) {
  const { db, stop, pool } = await getIsolatedTestKysely({ runSeeds });

  const caller = createRouterClient(router, {
    context: {
      db,
    },
  });

  return { caller, db, pool, stop };
}

export const orpcTest = test.extend<{
  orpc: Awaited<ReturnType<typeof getTestRouterClient>>;
}>({
  orpc: async ({}, use) => {
    const { caller, db, pool, stop } = await getTestRouterClient();
    await use({ caller, db, pool, stop });
    await stop();
  },
});
