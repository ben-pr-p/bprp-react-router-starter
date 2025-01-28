import type { Kysely } from "kysely";
import type Database from "./types/Database";

let hasRunSeeds = false;
export async function idempotentlyRunSeedsWithinProcess(db: Kysely<Database>) {
  if (hasRunSeeds) {
    return;
  }

  hasRunSeeds = true;

  await db
    .insertInto("widget")
    .values({
      name: "My Seed Widget",
    })
    .execute();
}
