/**
 * The shop runs on SQLite on your own computer and on Postgres on Vercel (Vercel has no writable disk).
 * Both use the same models, so the Postgres schema is made from prisma/schema.prisma by swapping
 * only the datasource block. That way there is one schema to maintain.
 */
const DATASOURCE = /datasource\s+db\s*\{[^}]*\}/;

export function toPostgresSchema(schema, { directUrl = false } = {}) {
  if (!DATASOURCE.test(schema)) throw new Error("schema.prisma has no datasource block");
  const lines = ["datasource db {", '  provider = "postgresql"', '  url      = env("DATABASE_URL")'];
  if (directUrl) lines.push('  directUrl = env("DATABASE_URL_UNPOOLED")');
  lines.push("}");
  return schema.replace(DATASOURCE, lines.join("\n"));
}
