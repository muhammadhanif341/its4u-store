import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { toPostgresSchema } from "../scripts/postgres-schema.mjs";
import { MAX_IMAGE_SIDE, MAX_UPLOAD_BYTES, fitWithin, usesBlobStorage } from "../lib/upload";

const schema = fs.readFileSync(path.join(process.cwd(), "prisma", "schema.prisma"), "utf8");

test("postgres schema swaps only the datasource", () => {
  const pg = toPostgresSchema(schema);
  assert.match(pg, /provider = "postgresql"/);
  assert.doesNotMatch(pg, /sqlite/);
  assert.match(pg, /url\s+= env\("DATABASE_URL"\)/);
  assert.doesNotMatch(pg, /directUrl/);
  // models and the generator are untouched
  assert.equal(pg.replace(/datasource db \{[^}]*\}/, ""), schema.replace(/datasource db \{[^}]*\}/, ""));
  for (const m of ["model Product", "model Order", "model OrderItem", "model Setting"]) assert.ok(pg.includes(m));
});

test("postgres schema can use a direct (unpooled) connection for db push", () => {
  const pg = toPostgresSchema(schema, { directUrl: true });
  assert.match(pg, /directUrl = env\("DATABASE_URL_UNPOOLED"\)/);
});

test("postgres conversion fails loudly when the datasource is missing", () => {
  assert.throws(() => toPostgresSchema("model A { id String @id }"), /datasource/);
});

test("the schema only uses types that work on both SQLite and Postgres", () => {
  assert.doesNotMatch(schema, /^\s*enum\s/m);
  assert.doesNotMatch(schema, /@db\./);
  assert.doesNotMatch(schema, /Json\b/);
});

test("vercel-build prepares postgres, pushes the schema, seeds once, then builds", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  const steps = pkg.scripts["vercel-build"].split("&&").map((s: string) => s.trim());
  assert.ok(steps[0].includes("prepare-postgres"));
  assert.ok(steps.some((s: string) => s.startsWith("prisma generate") && s.includes("schema.postgres.prisma")));
  assert.ok(steps.some((s: string) => s.startsWith("prisma db push") && s.includes("schema.postgres.prisma")));
  assert.ok(steps.indexOf(steps.find((s: string) => s.includes("seed-once"))!) < steps.indexOf("next build"));
  assert.equal(steps.at(-1), "next build");
  // the normal local build and tests still use the SQLite schema
  assert.equal(pkg.scripts.build, "prisma generate && next build");
});

test("generated postgres schema is not committed", () => {
  const ignore = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
  assert.match(ignore, /schema\.postgres\.prisma/);
  assert.match(ignore, /\.vercel/);
});

test("photos use Vercel Blob only when a token is set", () => {
  assert.equal(usesBlobStorage({}), false);
  assert.equal(usesBlobStorage({ BLOB_READ_WRITE_TOKEN: "" }), false);
  assert.equal(usesBlobStorage({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" }), true);
});

test("upload limit stays under Vercel's 4.5 MB request cap", () => {
  assert.ok(MAX_UPLOAD_BYTES <= 4.5 * 1024 * 1024);
});

test("fitWithin shrinks the longest side and keeps the shape", () => {
  assert.deepEqual(fitWithin(4000, 3000), { width: MAX_IMAGE_SIDE, height: 1200 });
  assert.deepEqual(fitWithin(3000, 4000), { width: 1200, height: MAX_IMAGE_SIDE });
  assert.deepEqual(fitWithin(800, 600), { width: 800, height: 600 }, "small images are never enlarged");
  assert.deepEqual(fitWithin(1600, 1600), { width: 1600, height: 1600 });
  assert.deepEqual(fitWithin(10000, 1), { width: 1600, height: 1 }, "never collapses to zero");
});

test("upload API route saves to Blob in production and to disk locally", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "app/api/upload/route.ts"), "utf8");
  assert.match(src, /usesBlobStorage\(\)/);
  assert.match(src, /access: "public"/);
  assert.ok(src.indexOf("detectImageType") < src.indexOf("put("), "file type is checked before anything is stored");
  assert.ok(src.indexOf("isAdmin") < src.indexOf("formData"), "only a signed-in admin can upload");
});
