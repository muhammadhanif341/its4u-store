import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatLongDate, getAttentionProducts, getOrdersByDay, greeting } from "@/lib/admin-stats";
import { getDashboardStats } from "@/lib/products";
import { formatDateTime, formatPrice } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrdersChart } from "@/components/admin/OrdersChart";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";

export default async function DashboardPage() {
  await requireAdmin();
  const now = new Date();
  const [stats, recent, byDay, attention] = await Promise.all([
    getDashboardStats(db),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    getOrdersByDay(db, 7, now),
    getAttentionProducts(db, 5),
  ]);
  const weekOrders = byDay.reduce((n, d) => n + d.count, 0);
  const weekSales = byDay.reduce((n, d) => n + d.revenue, 0);

  return (
    <>
      <PageHeader
        kicker={formatLongDate(now)}
        title={greeting(now)}
        text="Here is what is happening in your shop today."
        actions={
          <>
            <Link href="/" target="_blank" className="btn-outline">
              <Icon name="external" className="h-4 w-4" />
              View store
            </Link>
            <Link href="/admin/products/new" className="btn-primary" data-testid="quick-add-product">
              <Icon name="plus" className="h-4 w-4" />
              Add product
            </Link>
          </>
        }
      />

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending orders"
          value={String(stats.pendingOrders)}
          hint={stats.pendingOrders > 0 ? "Waiting for your confirmation" : "All caught up"}
          icon="clock"
          tone="warning"
          href="/admin/orders?status=pending"
          testId="stat-pending-orders"
        />
        <StatCard
          label="Orders today"
          value={String(stats.ordersToday)}
          hint={`${stats.totalOrders} orders in total`}
          icon="orders"
          tone="brand"
          href="/admin/orders"
          testId="stat-orders-today"
        />
        <StatCard
          label="Delivered revenue"
          value={formatPrice(stats.revenue)}
          hint="From delivered orders"
          icon="cash"
          tone="success"
          href="/admin/orders?status=delivered"
          testId="stat-delivered-revenue"
        />
        <StatCard
          label="Active products"
          value={String(stats.activeProducts)}
          hint={stats.soldOut > 0 ? `${stats.soldOut} sold out` : "All in stock"}
          icon="phone"
          tone={stats.soldOut > 0 ? "danger" : "info"}
          href="/admin/products"
          testId="stat-active-products"
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2" aria-labelledby="chart-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="chart-title" className="text-h3">Orders, last 7 days</h2>
              <p className="mt-1 text-sm text-muted">Cancelled orders are not counted.</p>
            </div>
            <p className="text-right">
              <span className="font-display text-2xl font-bold text-ink-900">{weekOrders}</span>
              <span className="ml-1.5 text-sm text-muted">orders</span>
              <span className="block text-sm font-semibold text-tone-success-fg">{formatPrice(weekSales)} sales</span>
            </p>
          </div>
          <div className="mt-4">
            <OrdersChart data={byDay} />
          </div>
        </section>

        <section className="card p-6" aria-labelledby="attention-title">
          <h2 id="attention-title" className="text-h3">Needs your attention</h2>
          <ul className="mt-4 space-y-3">
            {stats.pendingOrders > 0 && (
              <li>
                <Link href="/admin/orders?status=pending" className="flex items-center gap-3 rounded-xl bg-tone-warning-bg p-3.5 text-tone-warning-fg transition hover:brightness-95">
                  <Icon name="clock" className="h-5 w-5 shrink-0" />
                  <span className="text-[15px] font-semibold">
                    {stats.pendingOrders} {stats.pendingOrders === 1 ? "order is" : "orders are"} waiting to be confirmed
                  </span>
                </Link>
              </li>
            )}
            {attention.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className={`flex items-center gap-3 rounded-xl p-3.5 transition hover:brightness-95 ${p.stock <= 0 ? "bg-tone-danger-bg text-tone-danger-fg" : "bg-surface-sunken text-ink-900"}`}
                >
                  <Icon name="alert" className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 text-[15px]">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-sm">{p.stock <= 0 ? "Sold out" : "Only 1 left"}</span>
                  </span>
                </Link>
              </li>
            ))}
            {stats.pendingOrders === 0 && attention.length === 0 && (
              <li className="flex items-center gap-3 rounded-xl bg-tone-success-bg p-3.5 text-tone-success-fg">
                <Icon name="check" className="h-5 w-5 shrink-0" strokeWidth={2.6} />
                <span className="text-[15px] font-semibold">Nothing needs attention. Great work!</span>
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden" aria-labelledby="recent-title">
        <div className="flex items-center justify-between gap-3 p-6 pb-4">
          <h2 id="recent-title" className="text-h3">Latest orders</h2>
          <Link href="/admin/orders" className="btn-ghost btn-sm">
            View all
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 pb-8 text-[15px] text-muted">No orders yet. They will show up here as soon as a customer orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono font-semibold">
                      <Link href={`/admin/orders/${o.id}`} className="text-brand-700 hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td>
                      {o.customerName}
                      <span className="block text-sm text-muted">{o.city}</span>
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</td>
                    <td className="whitespace-nowrap font-semibold">{formatPrice(o.total)}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
