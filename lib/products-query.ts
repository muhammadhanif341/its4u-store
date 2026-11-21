import type { Prisma } from "@prisma/client";
import { CONDITIONS, PTA_STATUSES } from "./constants";

export type SortValue = "newest" | "price-asc" | "price-desc";

/**
 * What the visitor chose on the shop page. Brand, condition, PTA status and storage can have several
 * values at once (Apple or Samsung). Inside one group the values are alternatives (OR);
 * between groups all must match (AND).
 */
export type ProductFilters = {
  q: string;
  brand: string[];
  type: "" | "new" | "used";
  condition: string[];
  pta: string[];
  storage: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortValue;
};

/** The filters that can hold more than one value. */
export const LIST_FILTERS = ["brand", "condition", "pta", "storage"] as const;
export type ListFilter = (typeof LIST_FILTERS)[number];

/** Changes to apply to a link: a string for a single value ("" clears it) or a list for the multi-value filters. */
export type FilterOverride = Partial<Record<keyof ProductFilters, string | string[]>>;

const MAX_PER_GROUP = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim();
}

/** Every value of a repeated query key (?brand=Apple&brand=Samsung), trimmed, without repeats or blanks. */
function many(value: string | string[] | undefined, maxLength: number): string[] {
  const raw = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const out: string[] = [];
  for (const r of raw) {
    const v = r.trim().slice(0, maxLength);
    if (v && !out.includes(v)) out.push(v);
    if (out.length >= MAX_PER_GROUP) break;
  }
  return out;
}

function positiveInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = parseInt(value, 10);
  return n > 0 ? n : null;
}

export function parseFilters(sp: SearchParams): ProductFilters {
  const type = one(sp.type);
  const sort = one(sp.sort);
  return {
    q: one(sp.q).slice(0, 80),
    brand: many(sp.brand, 40),
    type: type === "new" || type === "used" ? type : "",
    condition: many(sp.condition, 20).filter((c) => CONDITIONS.some((x) => x.value === c)),
    pta: many(sp.pta, 20).filter((p) => PTA_STATUSES.some((x) => x.value === p)),
    storage: many(sp.storage, 20),
    minPrice: positiveInt(one(sp.minPrice)),
    maxPrice: positiveInt(one(sp.maxPrice)),
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "newest",
  };
}

/** Adds the value if it is not in the list, removes it if it is. Used by the checkbox links. */
export function toggleIn(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function buildWhere(f: ProductFilters, opts: { includeInactive?: boolean } = {}): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  if (!opts.includeInactive) and.push({ active: true });
  if (f.q) {
    and.push({
      OR: [{ name: { contains: f.q } }, { brand: { contains: f.q } }, { model: { contains: f.q } }],
    });
  }
  if (f.brand.length) and.push({ brand: { in: f.brand } });
  if (f.type === "new") and.push({ condition: "new" });
  if (f.type === "used") and.push({ condition: { not: "new" } });
  if (f.condition.length) and.push({ condition: { in: f.condition } });
  if (f.pta.length) and.push({ ptaStatus: { in: f.pta } });
  if (f.storage.length) and.push({ storage: { in: f.storage } });
  if (f.minPrice !== null) and.push({ price: { gte: f.minPrice } });
  if (f.maxPrice !== null) and.push({ price: { lte: f.maxPrice } });
  return and.length ? { AND: and } : {};
}

export function buildOrderBy(sort: SortValue): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { price: "asc" };
  if (sort === "price-desc") return { price: "desc" };
  return { createdAt: "desc" };
}

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

/** Rebuild a query string from filters, optionally overriding some keys. Lists become repeated keys. */
export function filtersToQuery(f: ProductFilters, override: FilterOverride = {}): string {
  const params = new URLSearchParams();
  const pick = (key: keyof ProductFilters, current: string): string => {
    const o = override[key];
    return o === undefined ? current : Array.isArray(o) ? (o[0] ?? "") : o;
  };
  const list = (key: ListFilter): string[] => (override[key] !== undefined ? asList(override[key]) : f[key]);

  const put = (key: string, value: string) => value && params.set(key, value);
  put("q", pick("q", f.q));
  list("brand").forEach((v) => params.append("brand", v));
  put("type", pick("type", f.type));
  list("condition").forEach((v) => params.append("condition", v));
  list("pta").forEach((v) => params.append("pta", v));
  list("storage").forEach((v) => params.append("storage", v));
  put("minPrice", pick("minPrice", f.minPrice ? String(f.minPrice) : ""));
  put("maxPrice", pick("maxPrice", f.maxPrice ? String(f.maxPrice) : ""));
  put("sort", pick("sort", f.sort === "newest" ? "" : f.sort));
  const s = params.toString();
  return s ? `?${s}` : "";
}
