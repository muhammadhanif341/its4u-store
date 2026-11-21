import type { Prisma } from "@prisma/client";
import { CONDITIONS, PTA_STATUSES } from "./constants";

export type SortValue = "newest" | "price-asc" | "price-desc";

export type ProductFilters = {
  q: string;
  brand: string;
  type: "" | "new" | "used";
  condition: string;
  pta: string;
  storage: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortValue;
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim();
}

function positiveInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = parseInt(value, 10);
  return n > 0 ? n : null;
}

export function parseFilters(sp: SearchParams): ProductFilters {
  const type = one(sp.type);
  const condition = one(sp.condition);
  const pta = one(sp.pta);
  const sort = one(sp.sort);
  return {
    q: one(sp.q).slice(0, 80),
    brand: one(sp.brand).slice(0, 40),
    type: type === "new" || type === "used" ? type : "",
    condition: CONDITIONS.some((c) => c.value === condition) ? condition : "",
    pta: PTA_STATUSES.some((p) => p.value === pta) ? pta : "",
    storage: one(sp.storage).slice(0, 20),
    minPrice: positiveInt(one(sp.minPrice)),
    maxPrice: positiveInt(one(sp.maxPrice)),
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "newest",
  };
}

export function buildWhere(f: ProductFilters, opts: { includeInactive?: boolean } = {}): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  if (!opts.includeInactive) and.push({ active: true });
  if (f.q) {
    and.push({
      OR: [{ name: { contains: f.q } }, { brand: { contains: f.q } }, { model: { contains: f.q } }],
    });
  }
  if (f.brand) and.push({ brand: f.brand });
  if (f.type === "new") and.push({ condition: "new" });
  if (f.type === "used") and.push({ condition: { not: "new" } });
  if (f.condition) and.push({ condition: f.condition });
  if (f.pta) and.push({ ptaStatus: f.pta });
  if (f.storage) and.push({ storage: f.storage });
  if (f.minPrice !== null) and.push({ price: { gte: f.minPrice } });
  if (f.maxPrice !== null) and.push({ price: { lte: f.maxPrice } });
  return and.length ? { AND: and } : {};
}

export function buildOrderBy(sort: SortValue): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { price: "asc" };
  if (sort === "price-desc") return { price: "desc" };
  return { createdAt: "desc" };
}

/** Rebuild a query string from filters, optionally overriding some keys. */
export function filtersToQuery(f: ProductFilters, override: Partial<Record<keyof ProductFilters, string>> = {}): string {
  const params = new URLSearchParams();
  const merged: Record<string, string> = {
    q: f.q,
    brand: f.brand,
    type: f.type,
    condition: f.condition,
    pta: f.pta,
    storage: f.storage,
    minPrice: f.minPrice ? String(f.minPrice) : "",
    maxPrice: f.maxPrice ? String(f.maxPrice) : "",
    sort: f.sort === "newest" ? "" : f.sort,
    ...override,
  };
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `?${s}` : "";
}
