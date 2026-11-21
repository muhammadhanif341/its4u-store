// Writes prisma/schema.postgres.prisma for the Vercel build. See scripts/postgres-schema.mjs.
import fs from "node:fs";
import path from "node:path";
import { toPostgresSchema } from "./postgres-schema.mjs";

const dir = path.join(process.cwd(), "prisma");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add a Postgres database to the Vercel project first.");
  process.exit(1);
}
const source = fs.readFileSync(path.join(dir, "schema.prisma"), "utf8");
const out = toPostgresSchema(source, { directUrl: Boolean(process.env.DATABASE_URL_UNPOOLED) });
fs.writeFileSync(path.join(dir, "schema.postgres.prisma"), out);
console.log("Wrote prisma/schema.postgres.prisma");
