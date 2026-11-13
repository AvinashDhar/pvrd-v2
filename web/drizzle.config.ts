import { defineConfig } from "drizzle-kit";
import { loadEnvLocal } from "./lib/db/load-env";

loadEnvLocal();

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
