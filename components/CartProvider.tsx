"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addItem,
  cartCount,
  cartSubtotal,
  removeItem,
  setQty as setQtyFn,
  type CartItem,
} from "@/lib/cart";

const STORAGE_KEY = "its4u-cart-v1";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore broken storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be full or blocked */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => setItems((c) => addItem(c, item, qty)), []);
  const setQty = useCallback((id: string, qty: number) => setItems((c) => setQtyFn(c, id, qty)), []);
  const remove = useCallback((id: string) => setItems((c) => removeItem(c, id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({ items, ready, count: cartCount(items), subtotal: cartSubtotal(items), add, setQty, remove, clear }),
    [items, ready, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
