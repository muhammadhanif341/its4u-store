"use client";

import Link from "next/link";
import { Icon } from "./Icons";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink-900 transition hover:border-brand-300 hover:bg-brand-50 sm:px-4"
      aria-label={ready && count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      <Icon name="cart" className="h-5 w-5" />
      <span className="hidden sm:inline">Cart</span>
      {ready && count > 0 && (
        <span
          data-testid="cart-count"
          className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-accent-400 px-1.5 text-xs font-bold text-ink-900 ring-2 ring-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
