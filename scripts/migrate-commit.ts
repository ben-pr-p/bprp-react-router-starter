import { commit } from "graphile-migrate";
import { MIGRATIONS_FOLDER, LOCAL_DB_NAME } from "@/constants";

/**
 * Needs the following databases to exist locally:
 * - postgres
 * - my_app (change in constants.ts)
 * - my_app_shadow (change in constants.ts)
 */
async function main() {
  await commit({
    connectionString: `postgresql://postgres:postgres@localhost:5432/${LOCAL_DB_NAME}`,
    rootConnectionString: `postgresql://postgres:postgres@localhost:5432/postgres`,
    shadowConnectionString: `postgresql://postgres:postgres@localhost:5432/${LOCAL_DB_NAME}_shadow`,
    migrationsFolder: MIGRATIONS_FOLDER,
  });
}

main();
