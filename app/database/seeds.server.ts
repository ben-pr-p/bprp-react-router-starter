import type { Kysely } from "kysely";
import type Database from "@/database/types/Database";
import { seeds } from "./seeds/index.server";
import { config } from "@/config";

let hasRunSeeds = false;
export async function idempotentlyRunSeedsWithinProcess(db: Kysely<Database>) {
  if (hasRunSeeds) {
    console.log("🔄 Seeds already run in this process, skipping...");
    return;
  }

  console.log("🌱 Starting seed process...");
  hasRunSeeds = true;

  try {
    const scenario = config.SEEDS_SCENARIO;

    if (scenario === undefined) {
      console.log("🌱 No scenario provided, running default seeds...");
      await seeds.default(db);
    }

    if (scenario !== undefined) {
      console.log(`🌱 Running scenario: ${scenario}`);
      const scenarioSeeds = seeds.scenarios[scenario];
      if (scenarioSeeds.includeDefault) {
        console.log("🌱 Including default seeds in scenario...");
        await seeds.default(db);
        console.log("🌱 Default seeds completed");
      }
      await scenarioSeeds.fn(db);
      console.log(`🌱 Scenario ${scenario} completed`);
    }
  } catch (error) {
    console.error("❌ Error running seeds:", error);
    throw error;
  }
}
