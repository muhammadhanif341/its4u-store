// Removes all orders and any products you added, then re-loads the sample phones.
// Usage: npx tsx scripts/reset-demo.ts
import { rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await rm(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"), { recursive: true, force: true });
  console.log("Orders, products and uploaded images removed. Run `npm run seed` to add the sample phones again.");
}

main().finally(() => db.$disconnect());
