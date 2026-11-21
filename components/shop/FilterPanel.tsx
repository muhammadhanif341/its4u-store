import Link from "next/link";
import { CONDITIONS, PTA_STATUSES } from "@/lib/constants";
import type { ProductFilters } from "@/lib/products-query";
import { BUDGETS } from "@/lib/storefront";
import { Icon } from "../Icons";

export type Facets = {
  total: number;
  newCount: number;
  usedCount: number;
  brands: { value: string; count: number }[];
  conditions: Record<string, number>;
  pta: Record<string, number>;
  storages: { value: string; count: number }[];
};

type Over = Partial<Record<keyof ProductFilters, string>>;

function Option({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`group flex min-h-[40px] items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
        active ? "bg-brand-50 font-semibold text-brand-700" : "text-body hover:bg-surface-sunken hover:text-ink-900"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition ${
            active ? "border-brand-600 bg-brand-600" : "border-[#94A3B8] group-hover:border-brand-500"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && <span className="shrink-0 text-xs font-medium text-muted">{count}</span>}
    </Link>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={title} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/** Hidden inputs so a search or price form keeps the filters that are already chosen. */
function Keep({ filters, skip }: { filters: ProductFilters; skip: (keyof ProductFilters)[] }) {
  const entries: [keyof ProductFilters, string][] = [
    ["q", filters.q],
    ["type", filters.type],
    ["brand", filters.brand],
    ["condition", filters.condition],
    ["pta", filters.pta],
    ["storage", filters.storage],
    ["minPrice", filters.minPrice ? String(filters.minPrice) : ""],
    ["maxPrice", filters.maxPrice ? String(filters.maxPrice) : ""],
    ["sort", filters.sort === "newest" ? "" : filters.sort],
  ];
  return (
    <>
      {entries
        .filter(([k, v]) => v && !skip.includes(k))
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
    </>
  );
}

/**
 * The filter sidebar. Every choice is a normal link, so it works without JavaScript and each
 * filtered page has its own address. `idPrefix` keeps input ids unique when the panel is on the page twice
 * (once for phones, once for desktops).
 */
export function FilterPanel({
  filters,
  facets,
  href,
  idPrefix,
  activeCount,
}: {
  filters: ProductFilters;
  facets: Facets;
  href: (over: Over) => string;
  idPrefix: string;
  activeCount: number;
}) {
  const budgetActive = (b: (typeof BUDGETS)[number]) => filters.minPrice === (b.minPrice ?? null) && filters.maxPrice === (b.maxPrice ?? null);

  return (
    <div className="card space-y-5 p-4 sm:p-5" data-testid="filter-panel">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-base font-semibold text-ink-900">
          <Icon name="sliders" className="h-5 w-5 text-brand-600" />
          Filters
        </p>
        {activeCount > 0 && (
          <Link href="/shop" className="text-sm font-semibold text-brand-700 hover:underline">
            Clear all ({activeCount})
          </Link>
        )}
      </div>

      <form action="/shop" method="get" role="search" className="relative">
        <Keep filters={filters} skip={["q"]} />
        <label htmlFor={`${idPrefix}-q`} className="sr-only">Search phones</label>
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={`${idPrefix}-q`}
          name="q"
          defaultValue={filters.q}
          placeholder="Search model or brand"
          className="input !rounded-lg !py-2.5 !pl-10 text-[15px]"
        />
      </form>

      <Group title="Type">
        <Option href={href({ type: "" })} active={!filters.type} label="All phones" count={facets.total} />
        <Option href={href({ type: "new" })} active={filters.type === "new"} label="New" count={facets.newCount} />
        <Option href={href({ type: "used" })} active={filters.type === "used"} label="Used" count={facets.usedCount} />
      </Group>

      <Group title="PTA status">
        <Option href={href({ pta: "" })} active={!filters.pta} label="Any status" />
        {PTA_STATUSES.map((p) => (
          <Option key={p.value} href={href({ pta: p.value })} active={filters.pta === p.value} label={p.label} count={facets.pta[p.value] ?? 0} />
        ))}
      </Group>

      {facets.brands.length > 0 && (
        <Group title="Brand">
          <Option href={href({ brand: "" })} active={!filters.brand} label="All brands" />
          {facets.brands.map((b) => (
            <Option key={b.value} href={href({ brand: b.value })} active={filters.brand === b.value} label={b.value} count={b.count} />
          ))}
        </Group>
      )}

      <Group title="Condition">
        <Option href={href({ condition: "" })} active={!filters.condition} label="Any condition" />
        {CONDITIONS.map((c) => (
          <Option key={c.value} href={href({ condition: c.value })} active={filters.condition === c.value} label={c.label} count={facets.conditions[c.value] ?? 0} />
        ))}
      </Group>

      {facets.storages.length > 0 && (
        <Group title="Storage">
          <div className="flex flex-wrap gap-2 px-1 pt-1">
            {facets.storages.map((s) => {
              const active = filters.storage === s.value;
              return (
                <Link
                  key={s.value}
                  href={href({ storage: active ? "" : s.value })}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                    active ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-body hover:border-brand-300 hover:text-brand-700"
                  }`}
                >
                  {s.value}
                </Link>
              );
            })}
          </div>
        </Group>
      )}

      <Group title="Price">
        <Option href={href({ minPrice: "", maxPrice: "" })} active={!filters.minPrice && !filters.maxPrice} label="Any price" />
        {BUDGETS.map((b) => (
          <Option
            key={b.label}
            href={href({ minPrice: b.minPrice ? String(b.minPrice) : "", maxPrice: b.maxPrice ? String(b.maxPrice) : "" })}
            active={budgetActive(b)}
            label={b.label}
          />
        ))}
        <form action="/shop" method="get" className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2 px-1">
          <Keep filters={filters} skip={["minPrice", "maxPrice"]} />
          <div>
            <label htmlFor={`${idPrefix}-min`} className="mb-1 block text-xs font-semibold text-muted">Min (Rs.)</label>
            <input id={`${idPrefix}-min`} name="minPrice" inputMode="numeric" defaultValue={filters.minPrice ?? ""} placeholder="0" className="input !rounded-lg !px-3 !py-2 text-sm" />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-max`} className="mb-1 block text-xs font-semibold text-muted">Max (Rs.)</label>
            <input id={`${idPrefix}-max`} name="maxPrice" inputMode="numeric" defaultValue={filters.maxPrice ?? ""} placeholder="Any" className="input !rounded-lg !px-3 !py-2 text-sm" />
          </div>
          <button type="submit" className="btn-primary btn-sm !min-h-[40px]" aria-label="Apply price range">
            Go
          </button>
        </form>
      </Group>
    </div>
  );
}
