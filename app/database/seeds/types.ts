import type { Kysely } from "kysely";
import type Database from "@/database/types/Database";

export type SeedsFn = (db: Kysely<Database>) => Promise<void>;
export type SeedsFnWithOptions = {
  includeDefault: boolean;
  fn: SeedsFn;
};

export type Seeds = {
  default: SeedsFn;
  scenarios: Record<
    string,
    {
      includeDefault?: boolean;
      fn: SeedsFn;
    }
  >;
};
