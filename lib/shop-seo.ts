import { conditionShort, ptaLabel } from "./constants";
import { filtersToQuery, type ProductFilters } from "./products-query";
import { metaDescription } from "./seo";

/** Page heading (h1) for the shop, based on what the visitor filtered. */
export function shopTitle(f: ProductFilters): string {
  if (f.q) return `Search results for “${f.q}”`;
  const parts: string[] = [];
  if (f.type === "new") parts.push("New");
  if (f.type === "used") parts.push("Used");
  if (f.pta) parts.push(ptaLabel(f.pta));
  if (f.condition) parts.push(conditionShort(f.condition));
  if (f.brand) parts.push(f.brand);
  if (parts.length === 0) return "Shop phones";
  return `${parts.join(" ")} phones`;
}

export function shopDescription(f: ProductFilters, shopName: string): string {
  const what = shopTitle(f).toLowerCase();
  return metaDescription(
    `Browse ${what} at ${shopName}. Compare condition, PTA status and price, then order online with cash on delivery.`,
  );
}

/** Only these filters make a page worth indexing; searches, prices and sorting are noise. */
export function shopIsIndexable(f: ProductFilters): boolean {
  return !f.q && !f.storage && f.minPrice === null && f.maxPrice === null && f.sort === "newest";
}

/** Canonical address of a filtered shop page: the same page without noise filters. */
export function shopCanonicalPath(f: ProductFilters): string {
  const clean: ProductFilters = { ...f, q: "", storage: "", minPrice: null, maxPrice: null, sort: "newest" };
  return `/shop${filtersToQuery(clean)}`;
}
