"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { Icon } from "./Icons";
import { PhoneImage } from "./PhoneImage";
import { calcTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";

export function CartView({ deliveryFee, freeAbove }: { deliveryFee: number; freeAbove: number }) {
  const { items, ready, setQty, remove, subtotal } = useCart();

  if (!ready) return <p className="py-10 text-muted">Loading your cart...</p>;

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center" data-testid="empty-cart">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon name="cart" className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-h3">Your cart is empty</h2>
        <p className="mt-2 text-muted">Find a phone you like and add it to your cart.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse phones
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const totals = calcTotals(subtotal, deliveryFee, freeAbove);
  const remaining = freeAbove > 0 && totals.deliveryFee > 0 ? freeAbove - subtotal : 0;
  const progress = freeAbove > 0 ? Math.min(100, Math.round((subtotal / freeAbove) * 100)) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <ul className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <li key={item.id} className="card flex gap-4 p-4" data-testid="cart-line">
            <PhoneImage
              images={item.image ? [item.image] : []}
              name={item.name}
              brand={item.name.split(" ")[0]}
              className="h-28 w-24 shrink-0 overflow-hidden rounded-xl"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/shop/${item.slug}`} className="text-base font-semibold leading-snug text-ink-900 hover:text-brand-700">
                  {item.name}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-tone-danger-bg hover:text-tone-danger-fg"
                  aria-label={`Remove ${item.name}`}
                >
                  <Icon name="trash" className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-0.5 text-sm text-muted">{formatPrice(item.price)} each</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex items-center rounded-xl border border-line">
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-l-xl text-lg font-semibold hover:bg-surface-sunken"
                    onClick={() => setQty(item.id, item.qty - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    &minus;
                  </button>
                  <span className="w-8 text-center font-semibold" data-testid="line-qty" aria-live="polite">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-r-xl text-lg font-semibold hover:bg-surface-sunken disabled:opacity-40"
                    onClick={() => setQty(item.id, item.qty + 1)}
                    disabled={item.qty >= item.stock}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <p className="font-display text-lg font-bold text-ink-900">{formatPrice(item.price * item.qty)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-6 lg:sticky lg:top-40">
        <h2 className="text-h3">Order summary</h2>
        <dl className="mt-5 space-y-3 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold text-ink-900" data-testid="subtotal">{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-semibold text-ink-900" data-testid="delivery">{totals.deliveryFee === 0 ? "Free" : formatPrice(totals.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-lg">
            <dt className="font-semibold text-ink-900">Total</dt>
            <dd className="font-display text-xl font-bold text-ink-900" data-testid="total">{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        {freeAbove > 0 && (
          <div className="mt-5 rounded-xl bg-surface p-3.5">
            <p className="text-sm font-medium text-ink-800">
              {remaining > 0 ? `Add ${formatPrice(remaining)} more for free delivery` : "You have free delivery"}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <Link href="/checkout" className="btn-accent mt-6 w-full !min-h-[52px] text-base">
          Proceed to checkout
          <Icon name="arrow" className="h-5 w-5" />
        </Link>
        <Link href="/shop" className="mt-3 block text-center text-sm font-semibold text-brand-700 hover:underline">
          Continue shopping
        </Link>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
          <Icon name="cash" className="h-4 w-4" />
          Pay cash when your phone arrives
        </p>
      </aside>
    </div>
  );
}
