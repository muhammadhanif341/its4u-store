"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/order";
import { PAYMENT_METHODS } from "@/lib/constants";
import { calcTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { Icon } from "./Icons";

const initial: CheckoutState = {};

export function CheckoutForm({ deliveryFee, freeAbove }: { deliveryFee: number; freeAbove: number }) {
  const { items, ready, subtotal } = useCart();
  const [state, formAction, pending] = useActionState(placeOrder, initial);
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  if (!ready) return <p className="py-10 text-muted">Loading...</p>;

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h2 className="text-h3">Your cart is empty</h2>
        <p className="mt-2 text-muted">Add a phone to your cart before checking out.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse phones
        </Link>
      </div>
    );
  }

  const totals = calcTotals(subtotal, deliveryFee, freeAbove);
  const cartJson = JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })));

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-3" noValidate>
      <input type="hidden" name="cart" value={cartJson} />

      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-4 text-sm font-medium text-tone-danger-fg" data-testid="form-error">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
            {state.error}
          </p>
        )}

        <section className="card space-y-5 p-6">
          <h2 className="text-h3">Delivery details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" defaultValue={v.name} className="input" autoComplete="name" aria-invalid={Boolean(err.name)} />
              {err.name && <p className="field-error">{err.name}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="label">Mobile number</label>
              <input id="phone" name="phone" defaultValue={v.phone} className="input" inputMode="tel" placeholder="03001234567" autoComplete="tel" aria-invalid={Boolean(err.phone)} />
              {err.phone && <p className="field-error">{err.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="city" className="label">City</label>
              <input id="city" name="city" defaultValue={v.city} className="input" autoComplete="address-level2" aria-invalid={Boolean(err.city)} />
              {err.city && <p className="field-error">{err.city}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="address" className="label">Complete address</label>
            <textarea id="address" name="address" rows={3} defaultValue={v.address} className="input" autoComplete="street-address" aria-invalid={Boolean(err.address)} />
            {err.address && <p className="field-error">{err.address}</p>}
          </div>
          <div>
            <label htmlFor="notes" className="label">Order notes <span className="font-normal text-muted">(optional)</span></label>
            <textarea id="notes" name="notes" rows={2} defaultValue={v.notes} className="input" />
            {err.notes && <p className="field-error">{err.notes}</p>}
          </div>
        </section>

        <fieldset className="card p-6">
          <legend className="sr-only">Payment method</legend>
          <h2 className="text-h3" aria-hidden="true">Payment method</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} className="relative flex cursor-pointer gap-3 rounded-xl border border-line p-4 transition hover:border-brand-300 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:shadow-glow">
                <input type="radio" name="paymentMethod" value={m.value} defaultChecked={(v.paymentMethod || "cod") === m.value} className="mt-1 h-4 w-4 accent-[#4548DB]" />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-ink-900">
                    <Icon name={m.value === "cod" ? "cash" : "chat"} className="h-5 w-5 text-brand-600" />
                    {m.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {m.value === "cod"
                      ? "Pay the rider when you receive and check your phone."
                      : "After placing the order you will send it to us on WhatsApp to confirm."}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {err.paymentMethod && <p className="field-error">{err.paymentMethod}</p>}
        </fieldset>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-40">
        <h2 className="text-h3">Your order</h2>
        <ul className="mt-4 divide-y divide-line text-[15px]">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-3">
              <span className="text-ink-900">
                {i.name} <span className="text-muted">x{i.qty}</span>
              </span>
              <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2.5 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-semibold">{totals.deliveryFee === 0 ? "Free" : formatPrice(totals.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-lg">
            <dt className="font-semibold text-ink-900">Total</dt>
            <dd className="font-display text-xl font-bold text-ink-900">{formatPrice(totals.total)}</dd>
          </div>
        </dl>
        <button type="submit" disabled={pending} className="btn-accent mt-6 w-full !min-h-[52px] text-base" data-testid="place-order">
          {pending ? "Placing order..." : "Place order"}
        </button>
        <p className="mt-4 text-sm text-muted">
          By placing your order you agree to our{" "}
          <Link href="/policies" className="font-semibold text-brand-700 underline">
            terms, warranty and return rules
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
