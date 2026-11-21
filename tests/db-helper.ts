import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

/** Creates a throwaway SQLite database (with the real schema) for one test file. */
export function makeTestDb(name: string) {
  const file = path.join(process.cwd(), "prisma", `test-${name}.db`);
  const remove = () => {
    for (const f of [file, `${file}-journal`]) if (fs.existsSync(f)) fs.rmSync(f, { force: true });
  };
  remove();

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: `file:./test-${name}.db` },
    stdio: "pipe",
  });

  const client = new PrismaClient({
    datasources: { db: { url: `file:${file.replace(/\\/g, "/")}` } },
  });

  return {
    client,
    cleanup: async () => {
      await client.$disconnect();
      remove();
    },
  };
}

let counter = 0;

export function productData(over: Partial<Prisma.ProductCreateInput> = {}): Prisma.ProductCreateInput {
  counter += 1;
  return {
    slug: `test-phone-${counter}`,
    name: `Test Phone ${counter}`,
    brand: "Apple",
    model: "Test",
    condition: "new",
    ptaStatus: "pta",
    price: 100000,
    stock: 2,
    ...over,
  };
}

export const customer = {
  name: "Ali Khan",
  phone: "03001234567",
  city: "Lahore",
  address: "House 12, Street 4, Model Town",
  notes: "",
  paymentMethod: "cod" as const,
};
