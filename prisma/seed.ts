import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/format";

const db = new PrismaClient();

type Seed = {
  name: string;
  brand: string;
  model: string;
  storage: string;
  ram: string;
  color: string;
  condition: string;
  ptaStatus: string;
  batteryHealth?: number;
  price: number;
  oldPrice?: number;
  stock: number;
  warranty: string;
  description: string;
  featured?: boolean;
};

const PRODUCTS: Seed[] = [
  {
    name: "iPhone 15 Pro Max 256GB",
    brand: "Apple", model: "iPhone 15 Pro Max", storage: "256GB", ram: "8GB", color: "Natural Titanium",
    condition: "new", ptaStatus: "pta", price: 489000, oldPrice: 509000, stock: 3,
    warranty: "1 year brand warranty",
    description: "Box packed, sealed, with original charger cable. Official PTA approved.",
    featured: true,
  },
  {
    name: "iPhone 14 Pro 128GB",
    brand: "Apple", model: "iPhone 14 Pro", storage: "128GB", ram: "6GB", color: "Deep Purple",
    condition: "like-new", ptaStatus: "pta", batteryHealth: 94, price: 245000, stock: 1,
    warranty: "3 months shop warranty",
    description: "Looks and works like new. No marks. Comes with box and cable.",
    featured: true,
  },
  {
    name: "iPhone 13 128GB",
    brand: "Apple", model: "iPhone 13", storage: "128GB", ram: "4GB", color: "Midnight",
    condition: "excellent", ptaStatus: "non-pta", batteryHealth: 89, price: 118000, oldPrice: 128000, stock: 2,
    warranty: "1 month shop warranty",
    description: "Very light marks only. Non-PTA, factory unlocked. PTA tax must be paid for a local SIM.",
  },
  {
    name: "iPhone 11 64GB",
    brand: "Apple", model: "iPhone 11", storage: "64GB", ram: "4GB", color: "Black",
    condition: "good", ptaStatus: "jv", batteryHealth: 82, price: 62000, stock: 1,
    warranty: "15 days check warranty",
    description: "JV set in good working condition. Normal signs of use.",
  },
  {
    name: "Samsung Galaxy S24 Ultra 256GB",
    brand: "Samsung", model: "Galaxy S24 Ultra", storage: "256GB", ram: "12GB", color: "Titanium Gray",
    condition: "new", ptaStatus: "pta", price: 395000, stock: 2,
    warranty: "1 year official warranty",
    description: "Brand new, box pack, PTA approved.",
    featured: true,
  },
  {
    name: "Samsung Galaxy S22 Ultra 256GB",
    brand: "Samsung", model: "Galaxy S22 Ultra", storage: "256GB", ram: "12GB", color: "Phantom Black",
    condition: "good", ptaStatus: "pta", batteryHealth: 86, price: 128000, stock: 1,
    warranty: "1 month shop warranty",
    description: "S Pen included. Some light marks on the frame. Screen is clean.",
  },
  {
    name: "Samsung Galaxy A54 128GB",
    brand: "Samsung", model: "Galaxy A54", storage: "128GB", ram: "8GB", color: "Awesome Violet",
    condition: "open-box", ptaStatus: "pta", price: 92000, stock: 4,
    warranty: "6 months shop warranty",
    description: "Open box, practically unused. All accessories in the box.",
  },
  {
    name: "Xiaomi Redmi Note 13 Pro 256GB",
    brand: "Xiaomi", model: "Redmi Note 13 Pro", storage: "256GB", ram: "8GB", color: "Midnight Black",
    condition: "new", ptaStatus: "pta", price: 78000, oldPrice: 82000, stock: 6,
    warranty: "1 year warranty",
    description: "Box packed with 67W charger.",
  },
  {
    name: "Infinix Note 30 128GB",
    brand: "Infinix", model: "Note 30", storage: "128GB", ram: "8GB", color: "Magic Black",
    condition: "fair", ptaStatus: "pta", batteryHealth: 78, price: 24000, stock: 2,
    warranty: "7 days check warranty",
    description: "Visible scratches on the back, fully working. Priced low for the condition.",
  },
  {
    name: "Google Pixel 7 Pro 128GB",
    brand: "Google", model: "Pixel 7 Pro", storage: "128GB", ram: "12GB", color: "Obsidian",
    condition: "excellent", ptaStatus: "non-pta", batteryHealth: 91, price: 98000, stock: 1,
    warranty: "1 month shop warranty",
    description: "Non-PTA, factory unlocked. Excellent camera, clean body.",
  },
];

async function main() {
  for (const p of PRODUCTS) {
    const slug = slugify(`${p.name}-${p.condition}-${p.ptaStatus}`);
    const data = {
      name: p.name,
      brand: p.brand,
      model: p.model,
      storage: p.storage,
      ram: p.ram,
      color: p.color,
      condition: p.condition,
      ptaStatus: p.ptaStatus,
      batteryHealth: p.batteryHealth ?? null,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      stock: p.stock,
      warranty: p.warranty,
      description: p.description,
      featured: p.featured ?? false,
    };
    await db.product.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
