// Creates a few sample orders on different days so the admin dashboard has something to show.
// Usage: npx tsx scripts/demo-orders.ts   (undo with: npx tsx scripts/reset-demo.ts && npm run seed)
import { PrismaClient } from "@prisma/client";
import { createOrder, setOrderStatus } from "../lib/orders";

const db = new PrismaClient();

const people = [
  { name: "Ali Khan", phone: "03001234567", city: "Lahore", address: "House 12, Street 4, Model Town" },
  { name: "Sara Ahmed", phone: "03211234567", city: "Karachi", address: "Flat 7, Block B, Gulshan-e-Iqbal" },
  { name: "Usman Raza", phone: "03331234567", city: "Islamabad", address: "House 3, Street 9, F-10/2" },
];

async function main() {
  const products = await db.product.findMany({ where: { active: true, stock: { gt: 1 } }, take: 6 });
  const plan: { daysAgo: number; status: string }[] = [
    { daysAgo: 0, status: "pending" },
    { daysAgo: 0, status: "pending" },
    { daysAgo: 1, status: "confirmed" },
    { daysAgo: 2, status: "delivered" },
    { daysAgo: 2, status: "shipped" },
    { daysAgo: 4, status: "delivered" },
    { daysAgo: 5, status: "cancelled" },
  ];

  for (let i = 0; i < plan.length; i++) {
    const p = products[i % products.length];
    const person = people[i % people.length];
    const order = await createOrder(
      db,
      { ...person, notes: "", paymentMethod: i % 2 === 0 ? "cod" : "whatsapp" },
      [{ id: p.id, qty: 1 }],
      { deliveryFee: 250, freeAbove: 150000 },
    );
    if (plan[i].status !== "pending") await setOrderStatus(db, order.id, plan[i].status);
    const when = new Date();
    when.setDate(when.getDate() - plan[i].daysAgo);
    when.setHours(10 + i, 15, 0, 0);
    await db.order.update({ where: { id: order.id }, data: { createdAt: when } });
  }
  console.log(`Created ${plan.length} demo orders.`);
}

main().finally(() => db.$disconnect());
