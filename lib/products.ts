import type { PrismaClient } from "@prisma/client";
import { slugify } from "./format";

/** Returns a slug that no other product uses (adds -2, -3, ... when needed). */
export async function uniqueSlug(db: PrismaClient, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "phone";
  let candidate = root;
  for (let n = 2; n < 1000; n++) {
    const clash = await db.product.findUnique({ where: { slug: candidate } });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

export async function getDashboardStats(db: PrismaClient, now: Date = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [pendingOrders, ordersToday, totalOrders, activeProducts, soldOut, delivered] = await Promise.all([
    db.order.count({ where: { status: "pending" } }),
    db.order.count({ where: { createdAt: { gte: startOfDay } } }),
    db.order.count(),
    db.product.count({ where: { active: true } }),
    db.product.count({ where: { active: true, stock: { lte: 0 } } }),
    db.order.aggregate({ where: { status: "delivered" }, _sum: { total: true } }),
  ]);

  return {
    pendingOrders,
    ordersToday,
    totalOrders,
    activeProducts,
    soldOut,
    revenue: delivered._sum.total ?? 0,
  };
}
