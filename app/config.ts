import dotenv from "dotenv";
import { bool, cleanEnv, email, str } from "envalid";

dotenv.config();

export const MIGRATIONS_FOLDER = "./app/database/migrations";

// biome-ignore lint/nursery/noProcessEnv: this is the one place to use it
export const config = cleanEnv(process.env, {
  DATABASE_URL: str({ devDefault: undefined }),
  RUN_WORKER: bool({ default: true, devDefault: true }),
  SENDGRID_API_KEY: str({ devDefault: undefined }),
  EMAIL_FROM_EMAIL: email({ devDefault: undefined }),
  EMAIL_FROM_NAME: str({ devDefault: undefined }),
});
