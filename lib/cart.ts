export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
  stock: number;
};

function clampQty(qty: number, stock: number): number {
  const q = Math.floor(Number.isFinite(qty) ? qty : 0);
  return Math.max(0, Math.min(q, Math.max(stock, 0)));
}

export function addItem(items: CartItem[], item: Omit<CartItem, "qty">, qty = 1): CartItem[] {
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    const next = clampQty(existing.qty + qty, item.stock);
    if (next <= 0) return items.filter((i) => i.id !== item.id);
    return items.map((i) => (i.id === item.id ? { ...i, ...item, qty: next } : i));
  }
  const next = clampQty(qty, item.stock);
  if (next <= 0) return items;
  return [...items, { ...item, qty: next }];
}

export function setQty(items: CartItem[], id: string, qty: number): CartItem[] {
  return items.flatMap((i) => {
    if (i.id !== id) return [i];
    const next = clampQty(qty, i.stock);
    return next <= 0 ? [] : [{ ...i, qty: next }];
  });
}

export function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id !== id);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
