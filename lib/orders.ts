import type { PrismaClient } from "@prisma/client";
import { ORDER_STATUSES, type OrderStatus } from "./constants";
import { makeOrderNo, parseImages } from "./format";
import { calcTotals } from "./pricing";
import type { CheckoutData } from "./validation";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export type OrderLine = { id: string; qty: number };

export type OrderOptions = {
  deliveryFee: number;
  freeAbove: number;
  random?: () => number;
};

/**
 * Creates an order. Prices always come from the database (never from the
 * browser), stock is checked and decremented in the same transaction.
 */
export async function createOrder(
  db: PrismaClient,
  customer: CheckoutData,
  lines: OrderLine[],
  opts: OrderOptions,
) {
  const merged = new Map<string, number>();
  for (const line of lines) {
    const qty = Math.floor(Number(line.qty));
    if (!line.id || !(qty > 0)) continue;
    merged.set(line.id, (merged.get(line.id) ?? 0) + qty);
  }
  if (merged.size === 0) throw new OrderError("Your cart is empty.");

  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...merged.keys()] } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const items: { productId: string; name: string; price: number; qty: number; image: string | null }[] = [];

    for (const [id, qty] of merged) {
      const p = byId.get(id);
      if (!p || !p.active) throw new OrderError("One of the items in your cart is no longer available.");
      if (p.stock <= 0) throw new OrderError(`${p.name} is out of stock.`);
      if (p.stock < qty) throw new OrderError(`Only ${p.stock} left of ${p.name}.`);

      const res = await tx.product.updateMany({
        where: { id, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      if (res.count !== 1) throw new OrderError(`${p.name} was just sold out.`);

      subtotal += p.price * qty;
      items.push({ productId: id, name: p.name, price: p.price, qty, image: parseImages(p.images)[0] ?? null });
    }

    const totals = calcTotals(subtotal, opts.deliveryFee, opts.freeAbove);

    let orderNo = "";
    for (let attempt = 0; attempt < 5 && !orderNo; attempt++) {
      const candidate = makeOrderNo(opts.random);
      const exists = await tx.order.findUnique({ where: { orderNo: candidate } });
      if (!exists) orderNo = candidate;
    }
    if (!orderNo) throw new OrderError("Could not create the order. Please try again.");

    return tx.order.create({
      data: {
        orderNo,
        customerName: customer.name,
        phone: customer.phone,
        city: customer.city,
        address: customer.address,
        notes: customer.notes,
        paymentMethod: customer.paymentMethod,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        items: { create: items },
      },
      include: { items: true },
    });
  });
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Changes an order's status. Cancelling puts the stock back; cancelled orders stay cancelled. */
export async function setOrderStatus(db: PrismaClient, orderId: string, status: string) {
  if (!isOrderStatus(status)) throw new OrderError("Unknown order status.");

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderError("Order not found.");
    if (order.status === status) return order;
    if (order.status === "cancelled") throw new OrderError("A cancelled order cannot be reopened.");

    if (status === "cancelled") {
      for (const item of order.items) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    }
    return tx.order.update({ where: { id: orderId }, data: { status }, include: { items: true } });
  });
}

function lastTenDigits(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

/** Customers can look up their order with the order number and the phone number they used. */
export async function trackOrder(db: PrismaClient, orderNo: string, phone: string) {
  const order = await db.order.findUnique({
    where: { orderNo: orderNo.trim().toUpperCase() },
    include: { items: true },
  });
  if (!order) return null;
  const given = lastTenDigits(phone);
  if (given.length < 10 || given !== lastTenDigits(order.phone)) return null;
  return order;
}
