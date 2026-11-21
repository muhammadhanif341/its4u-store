import type { Metadata } from "next";
import { db } from "@/lib/db";
import { trackOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { StatusTimeline } from "@/components/StatusTimeline";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function TrackPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderNo = one(sp.order);
  const phone = one(sp.phone);
  const searched = Boolean(orderNo || phone);
  const order = orderNo && phone ? await trackOrder(db, orderNo, phone) : null;

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow">Order status</p>
        <h1 className="mt-2">Track your order</h1>
        <p className="mt-3 text-lead text-body">Enter your order number and the mobile number you used when ordering.</p>

        <form method="get" action="/track" className="card mt-8 space-y-5 p-6">
          <div>
            <label htmlFor="order" className="label">Order number</label>
            <input id="order" name="order" defaultValue={orderNo} placeholder="ORD-ABC123" className="input font-mono uppercase" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Mobile number</label>
            <input id="phone" name="phone" defaultValue={phone} placeholder="03001234567" inputMode="tel" className="input" autoComplete="tel" />
          </div>
          <button type="submit" className="btn-primary w-full !min-h-[48px]">
            <Icon name="search" className="h-5 w-5" />
            Track order
          </button>
        </form>

        {searched && !order && (
          <p role="alert" className="mt-5 flex gap-3 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-4 text-sm font-medium text-tone-danger-fg" data-testid="not-found">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
            We could not find an order with those details. Please check the order number and phone number.
          </p>
        )}

        {order && (
          <div className="card mt-5 p-6 sm:p-8" data-testid="track-result">
            <p className="text-sm text-muted">Order</p>
            <p className="font-mono text-xl font-bold text-brand-800">{order.orderNo}</p>
            <div className="mt-6">
              <StatusTimeline status={order.status} />
            </div>
            <ul className="mt-6 divide-y divide-line text-[15px]">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-3">
                  <span className="text-ink-900">
                    {i.name} <span className="text-muted">x{i.qty}</span>
                  </span>
                  <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-line pt-4 text-lg">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="font-display text-xl font-bold text-ink-900">{formatPrice(order.total)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
