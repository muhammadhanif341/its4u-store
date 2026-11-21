import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SORT_OPTIONS, conditionLabel, ptaLabel } from "@/lib/constants";
import { buildOrderBy, buildWhere, filtersToQuery, parseFilters, type FilterOverride, type ProductFilters } from "@/lib/products-query";
import { shopCanonicalPath, shopDescription, shopIsIndexable, shopTitle } from "@/lib/shop-seo";
import { breadcrumbJsonLd } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { ProductRow } from "@/components/ProductRow";
import { FilterPanel, type Facets } from "@/components/shop/FilterPanel";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const s = await getSettings(db);
  const title = shopTitle(filters);
  return {
    title,
    description: shopDescription(filters, s.shopName),
    alternates: { canonical: shopCanonicalPath(filters) },
    robots: shopIsIndexable(filters) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

function activeChips(f: ProductFilters) {
  const chips: { label: string; clear: FilterOverride }[] = [];
  if (f.q) chips.push({ label: `Search: ${f.q}`, clear: { q: "" } });
  if (f.type) chips.push({ label: f.type === "new" ? "New" : "Used", clear: { type: "" } });
  for (const b of f.brand) chips.push({ label: b, clear: { brand: f.brand.filter((x) => x !== b) } });
  for (const c of f.condition) chips.push({ label: conditionLabel(c), clear: { condition: f.condition.filter((x) => x !== c) } });
  for (const p of f.pta) chips.push({ label: ptaLabel(p), clear: { pta: f.pta.filter((x) => x !== p) } });
  for (const st of f.storage) chips.push({ label: st, clear: { storage: f.storage.filter((x) => x !== st) } });
  if (f.minPrice) chips.push({ label: `From ${formatPrice(f.minPrice)}`, clear: { minPrice: "" } });
  if (f.maxPrice) chips.push({ label: `Up to ${formatPrice(f.maxPrice)}`, clear: { maxPrice: "" } });
  return chips;
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const view: "grid" | "list" = (Array.isArray(sp.view) ? sp.view[0] : sp.view) === "list" ? "list" : "grid";

  /** A link to the shop with some filters changed. The chosen view (cards or rows) is kept. */
  const href = (over: FilterOverride, v: "grid" | "list" = view) => {
    const base = filtersToQuery(filters, over);
    if (v !== "list") return `/shop${base}`;
    return `/shop${base ? `${base}&view=list` : "?view=list"}`;
  };

  const active = { where: { active: true } } as const;
  const [products, brandRows, condRows, ptaRows, storageRows] = await Promise.all([
    db.product.findMany({ where: buildWhere(filters), orderBy: buildOrderBy(filters.sort) }),
    db.product.groupBy({ by: ["brand"], ...active, _count: { _all: true }, orderBy: { brand: "asc" } }),
    db.product.groupBy({ by: ["condition"], ...active, _count: { _all: true } }),
    db.product.groupBy({ by: ["ptaStatus"], ...active, _count: { _all: true } }),
    db.product.groupBy({ by: ["storage"], where: { active: true, storage: { not: "" } }, _count: { _all: true }, orderBy: { storage: "asc" } }),
  ]);

  const conditions = Object.fromEntries(condRows.map((r) => [r.condition, r._count._all]));
  const total = condRows.reduce((n, r) => n + r._count._all, 0);
  const facets: Facets = {
    total,
    newCount: conditions.new ?? 0,
    usedCount: total - (conditions.new ?? 0),
    brands: brandRows.map((r) => ({ value: r.brand, count: r._count._all })),
    conditions,
    pta: Object.fromEntries(ptaRows.map((r) => [r.ptaStatus, r._count._all])),
    storages: storageRows.map((r) => ({ value: r.storage, count: r._count._all })),
  };

  const chips = activeChips(filters);
  const title = shopTitle(filters);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])} />

      <section className="border-b border-line bg-gradient-to-b from-white to-surface">
        <div className="container-x py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/" className="hover:text-brand-700">Home</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-ink-900">Shop</span>
          </nav>
          <h1 className="mt-3">{title}</h1>
          <p className="mt-2 max-w-2xl text-lead text-body" data-testid="result-count">
            {`${products.length} ${products.length === 1 ? "phone" : "phones"} found`}
          </p>
        </div>
      </section>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[290px_minmax(0,1fr)]">
        {/* Phones and tablets: the filters fold away */}
        <details className="card lg:hidden" open={chips.length > 0}>
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-ink-900">
            <span className="flex items-center gap-2">
              <Icon name="filter" className="h-5 w-5 text-brand-600" />
              Filters{chips.length > 0 ? ` (${chips.length})` : ""}
            </span>
            <span className="text-sm font-medium text-muted">Tap to open</span>
          </summary>
          <div className="border-t border-line p-1">
            <FilterPanel filters={filters} facets={facets} href={href} idPrefix="m" activeCount={chips.length} />
          </div>
        </details>

        {/* Desktop: a sidebar that stays in view */}
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto rounded-2xl pr-1">
            <FilterPanel filters={filters} facets={facets} href={href} idPrefix="d" activeCount={chips.length} />
          </div>
        </aside>

        <section aria-label="Phones" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted">Sort:</span>
              {SORT_OPTIONS.map((o) => {
                const on = filters.sort === o.value;
                return (
                  <Link
                    key={o.value}
                    href={href({ sort: o.value === "newest" ? "" : o.value })}
                    aria-current={on ? "true" : undefined}
                    className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                      on ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-body hover:border-brand-300 hover:text-brand-700"
                    }`}
                  >
                    {o.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1" role="group" aria-label="Layout">
              {(["grid", "list"] as const).map((v) => (
                <Link
                  key={v}
                  href={href({}, v)}
                  aria-current={view === v ? "true" : undefined}
                  aria-label={v === "grid" ? "Show phones as cards" : "Show phones as a list"}
                  className={`grid h-9 w-10 place-items-center rounded-lg transition ${view === v ? "bg-brand-600 text-white" : "text-muted hover:bg-surface-sunken hover:text-ink-900"}`}
                >
                  <Icon name={v === "grid" ? "grid" : "orders"} className="h-[18px] w-[18px]" />
                </Link>
              ))}
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Filters:</span>
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={href(c.clear)}
                  className="badge gap-1.5 bg-tone-brand-bg px-3 py-1.5 text-tone-brand-fg transition hover:bg-brand-200"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label}
                  <Icon name="close" className="h-3 w-3" strokeWidth={2.6} />
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="card mt-6 p-12 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name="search" className="h-8 w-8" />
              </span>
              <h2 className="mt-5 text-h3">No phones match these filters</h2>
              <p className="mx-auto mt-2 max-w-md text-muted">Try removing a filter, or message us on WhatsApp and we will help you find one.</p>
              <Link href="/shop" className="btn-primary mt-6">Show all phones</Link>
            </div>
          ) : view === "list" ? (
            <div className="mt-6 space-y-3" data-testid="product-list">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3" data-testid="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
