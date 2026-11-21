import type { PrismaClient } from "@prisma/client";

export type DayBucket = { date: string; label: string; count: number; revenue: number };

/** yyyy-mm-dd in the server's local time. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

/**
 * Counts orders and sales for each of the last `days` days (oldest first, today last).
 * Days with no orders are included with zeros. Cancelled orders are left out.
 */
export function bucketOrdersByDay(
  orders: { createdAt: Date; total: number; status: string }[],
  days: number,
  now: Date = new Date(),
): DayBucket[] {
  const buckets: DayBucket[] = [];
  const index = new Map<string, DayBucket>();
  const today = startOfDay(now);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const bucket: DayBucket = {
      date: localDateKey(d),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: 0,
      revenue: 0,
    };
    buckets.push(bucket);
    index.set(bucket.date, bucket);
  }
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const bucket = index.get(localDateKey(o.createdAt));
    if (bucket) {
      bucket.count += 1;
      bucket.revenue += o.total;
    }
  }
  return buckets;
}

export async function getOrdersByDay(db: PrismaClient, days = 7, now: Date = new Date()): Promise<DayBucket[]> {
  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));
  const orders = await db.order.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, total: true, status: true },
  });
  return bucketOrdersByDay(orders, days, now);
}

/** Visible phones that are sold out or down to their last piece. */
export async function getAttentionProducts(db: PrismaClient, limit = 6) {
  return db.product.findMany({
    where: { active: true, stock: { lte: 1 } },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true, name: true, stock: true, brand: true },
  });
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** e.g. "Friday 20 November 2026". Written by hand so it never depends on the machine's locale data. */
export function formatLongDate(now: Date = new Date()): string {
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}
