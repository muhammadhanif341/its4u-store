import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CONDITIONS, PTA_STATUSES, SORT_OPTIONS, conditionLabel, ptaLabel } from "@/lib/constants";
import { buildOrderBy, buildWhere, filtersToQuery, parseFilters, type ProductFilters } from "@/lib/products-query";
import { shopCanonicalPath, shopDescription, shopIsIndexable, shopTitle } from "@/lib/shop-seo";
import { breadcrumbJsonLd } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";

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
  const chips: { label: string; clear: Partial<Record<keyof ProductFilters, string>> }[] = [];
  if (f.q) chips.push({ label: `Search: ${f.q}`, clear: { q: "" } });
  if (f.type) chips.push({ label: f.type === "new" ? "New" : "Used", clear: { type: "" } });
  if (f.brand) chips.push({ label: f.brand, clear: { brand: "" } });
  if (f.condition) chips.push({ label: conditionLabel(f.condition), clear: { condition: "" } });
  if (f.pta) chips.push({ label: ptaLabel(f.pta), clear: { pta: "" } });
  if (f.storage) chips.push({ label: f.storage, clear: { storage: "" } });
  if (f.minPrice) chips.push({ label: `From ${formatPrice(f.minPrice)}`, clear: { minPrice: "" } });
  if (f.maxPrice) chips.push({ label: `Up to ${formatPrice(f.maxPrice)}`, clear: { maxPrice: "" } });
  return chips;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-body hover:border-brand-300 hover:text-brand-700"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ShopPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const q = (over: Partial<Record<keyof ProductFilters, string>>) => `/shop${filtersToQuery(filters, over)}`;

  const [products, brandRows, storageRows] = await Promise.all([
    db.product.findMany({ where: buildWhere(filters), orderBy: buildOrderBy(filters.sort) }),
    db.product.findMany({ where: { active: true }, select: { brand: true }, distinct: ["brand"], orderBy: { brand: "asc" } }),
    db.product.findMany({ where: { active: true, storage: { not: "" } }, select: { storage: true }, distinct: ["storage"], orderBy: { storage: "asc" } }),
  ]);

  const chips = activeChips(filters);
  const title = shopTitle(filters);
  const advancedCount = [filters.brand, filters.condition, filters.storage, filters.minPrice, filters.maxPrice, filters.q].filter(Boolean).length;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])} />

      <section className="border-b border-line bg-gradient-to-b from-white to-surface">
        <div className="container-x py-10 sm:py-12">
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

      <div className="container-x py-8">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip href={q({ type: "", pta: "" })} active={!filters.type && !filters.pta}>All phones</Chip>
          <Chip href={q({ type: "new" })} active={filters.type === "new"}>New</Chip>
          <Chip href={q({ type: "used" })} active={filters.type === "used"}>Used</Chip>
          <span className="mx-1 hidden w-px self-stretch bg-line sm:block" aria-hidden="true" />
          {PTA_STATUSES.map((p) => (
            <Chip key={p.value} href={q({ pta: filters.pta === p.value ? "" : p.value })} active={filters.pta === p.value}>
              {p.label}
            </Chip>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <details className="group w-full" open={advancedCount > 0}>
            <summary className="btn-outline inline-flex cursor-pointer list-none">
              <Icon name="filter" className="h-4 w-4" />
              More filters{advancedCount > 0 ? ` (${advancedCount})` : ""}
            </summary>
            <form method="get" action="/shop" className="card mt-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filters">
              {filters.type && <input type="hidden" name="type" value={filters.type} />}
              {filters.pta && <input type="hidden" name="pta" value={filters.pta} />}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="label" htmlFor="q">Search</label>
                <input id="q" name="q" defaultValue={filters.q} placeholder="e.g. iPhone 13, Galaxy S23" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="brand">Brand</label>
                <select id="brand" name="brand" defaultValue={filters.brand} className="input">
                  <option value="">All brands</option>
                  {brandRows.map((b) => (
                    <option key={b.brand} value={b.brand}>{b.brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="condition">Condition</label>
                <select id="condition" name="condition" defaultValue={filters.condition} className="input">
                  <option value="">Any condition</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="storage">Storage</label>
                <select id="storage" name="storage" defaultValue={filters.storage} className="input">
                  <option value="">Any storage</option>
                  {storageRows.map((s) => (
                    <option key={s.storage} value={s.storage}>{s.storage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="sort">Sort by</label>
                <select id="sort" name="sort" defaultValue={filters.sort} className="input">
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="minPrice">Min price (Rs.)</label>
                <input id="minPrice" name="minPrice" inputMode="numeric" defaultValue={filters.minPrice ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="maxPrice">Max price (Rs.)</label>
                <input id="maxPrice" name="maxPrice" inputMode="numeric" defaultValue={filters.maxPrice ?? ""} className="input" />
              </div>
              <div className="flex items-end gap-3 sm:col-span-2">
                <button type="submit" className="btn-primary">Apply filters</button>
                <Link href="/shop" className="btn-outline">Reset</Link>
              </div>
            </form>
          </details>
        </div>

        {chips.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Filters:</span>
            {chips.map((c) => (
              <Link
                key={c.label}
                href={q(c.clear)}
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
          <div className="card mt-8 p-12 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="search" className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-h3">No phones match these filters</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">Try removing a filter, or message us on WhatsApp and we will help you find one.</p>
            <Link href="/shop" className="btn-primary mt-6">Show all phones</Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
