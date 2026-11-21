export function calcDelivery(subtotal: number, fee: number, freeAbove: number): number {
  if (subtotal <= 0) return 0;
  if (freeAbove > 0 && subtotal >= freeAbove) return 0;
  return Math.max(0, Math.round(fee));
}

export function calcTotals(subtotal: number, fee: number, freeAbove: number) {
  const deliveryFee = calcDelivery(subtotal, fee, freeAbove);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export function toInt(value: string | number | null | undefined, fallback = 0): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
