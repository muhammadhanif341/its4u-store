import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ORDER_STATUSES, paymentLabel } from "@/lib/constants";
import { formatDateTime, formatPrice, whatsappUrl } from "@/lib/format";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { Icon } from "@/components/Icons";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusTimeline } from "@/components/StatusTimeline";

export const metadata: Metadata = { title: "Order" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5 text-[15px]">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink-900">{children}</dd>
    </div>
  );
}

export default async function AdminOrderPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const settings = await getSettings(db);

  const error = one(sp.error);
  const updated = one(sp.updated);
  const cancelled = order.status === "cancelled";
  const reply = whatsappUrl(order.phone, `Hello ${order.customerName}, this is ${settings.shopName} about your order ${order.orderNo}.`);

  return (
    <>
      <PageHeader
        kicker={`Placed ${formatDateTime(order.createdAt)}`}
        title={order.orderNo}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <Link href="/admin/orders" className="btn-outline">&larr; All orders</Link>
          </>
        }
      />
      <span className="sr-only" data-testid="order-title">{order.orderNo}</span>

      {error && (
        <p role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-4 text-sm font-semibold text-tone-danger-fg" data-testid="order-error">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </p>
      )}
      {updated && (
        <p role="status" className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#6EE7B7] bg-tone-success-bg p-4 text-sm font-semibold text-tone-success-fg" data-testid="order-updated">
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.6} />
          Order status updated.
        </p>
      )}

      <section className="card mb-6 p-6 sm:p-8" aria-label="Order progress">
        <StatusTimeline status={order.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6 sm:p-7">
          <h2 className="text-h3">Customer</h2>
          <dl className="mt-3 divide-y divide-line">
            <Row label="Name">{order.customerName}</Row>
            <Row label="Phone">
              <a href={`tel:${order.phone}`} className="text-brand-700 hover:underline">{order.phone}</a>
            </Row>
            <Row label="City">{order.city}</Row>
            <Row label="Address">{order.address}</Row>
            {order.notes && <Row label="Notes">{order.notes}</Row>}
            <Row label="Payment">{paymentLabel(order.paymentMethod)}</Row>
          </dl>
          <a href={reply} target="_blank" rel="noreferrer" className="btn-outline mt-5">
            <Icon name="chat" className="h-5 w-5" />
            Message on WhatsApp
          </a>
        </section>

        <section className="card p-6 sm:p-7">
          <h2 className="text-h3">Update status</h2>
          {cancelled ? (
            <p className="mt-4 flex gap-3 rounded-xl bg-surface p-4 text-[15px] text-body">
              <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              This order is cancelled. The stock was returned to the shop and it cannot be reopened.
            </p>
          ) : (
            <form action={updateOrderStatusAction} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={order.id} />
              <div>
                <label htmlFor="status" className="label">Status</label>
                <select id="status" name="status" defaultValue={order.status} className="input">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <p className="hint">Choosing Cancelled puts the phones back in stock.</p>
              </div>
              <button type="submit" className="btn-primary" data-testid="update-status">Update status</button>
            </form>
          )}
        </section>
      </div>

      <section className="card mt-6 overflow-hidden" aria-labelledby="items-title">
        <h2 id="items-title" className="p-6 pb-4 text-h3">Items</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Phone</th>
                <th scope="col">Price</th>
                <th scope="col">Qty</th>
                <th scope="col" className="text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="font-semibold text-ink-900">{i.name}</td>
                  <td className="whitespace-nowrap">{formatPrice(i.price)}</td>
                  <td>{i.qty}</td>
                  <td className="whitespace-nowrap text-right font-semibold">{formatPrice(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto w-full max-w-sm space-y-2 border-t border-line p-6 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-semibold">{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</dd></div>
          <div className="flex justify-between pt-1 text-lg"><dt className="font-semibold text-ink-900">Total</dt><dd className="font-display text-xl font-bold text-ink-900">{formatPrice(order.total)}</dd></div>
        </dl>
      </section>
    </>
  );
}
