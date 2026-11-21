import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, paymentLabel } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "";
  const status = (ORDER_STATUSES as readonly string[]).includes(raw) ? raw : "";

  const [orders, grouped] = await Promise.all([
    db.order.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 200 }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  const total = grouped.reduce((n, g) => n + g._count._all, 0);

  const tabs = [
    { value: "", label: "All", count: total },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: counts[s] ?? 0 })),
  ];

  return (
    <>
      <PageHeader title="Orders" text="Open an order to confirm it, ship it or contact the customer." />

      <nav aria-label="Filter by status" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((t) => {
          const active = status === t.value;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `/admin/orders?status=${t.value}` : "/admin/orders"}
              aria-current={active ? "true" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-body hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {t.label}
              <span className={`grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs ${active ? "bg-white/20" : "bg-surface-sunken"}`}>{t.count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="card overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="orders" className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-semibold text-ink-900">No orders here</p>
            <p className="mt-1 text-muted">{status ? "No orders have this status." : "New orders will appear here."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} data-testid="order-row">
                    <td className="font-mono font-semibold">
                      <Link href={`/admin/orders/${o.id}`} className="text-brand-700 hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td>
                      <span className="font-semibold text-ink-900">{o.customerName}</span>
                      <span className="block text-sm text-muted">{o.city} &middot; {o.phone}</span>
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</td>
                    <td className="whitespace-nowrap">{paymentLabel(o.paymentMethod)}</td>
                    <td className="whitespace-nowrap font-semibold">{formatPrice(o.total)}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/orders/${o.id}`} className="btn-ghost btn-sm" aria-label={`Open order ${o.orderNo}`}>
                        <Icon name="arrow" className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
