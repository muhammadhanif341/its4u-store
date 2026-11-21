// Adds the 10 sample phones the first time the database is empty. It remembers that it has done so,
// so deleting every phone later does not bring the samples back on the next deploy.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const done = await db.setting.findUnique({ where: { key: "sampleDataAdded" } });
  const products = await db.product.count();
  if (!done && products === 0) {
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  } else {
    console.log("Sample phones skipped (the shop already has its own data).");
  }
  await db.setting.upsert({ where: { key: "sampleDataAdded" }, update: {}, create: { key: "sampleDataAdded", value: "1" } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
