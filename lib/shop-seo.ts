import { conditionShort, ptaLabel } from "./constants";
import { filtersToQuery, type ProductFilters } from "./products-query";
import { metaDescription } from "./seo";

const or = (items: string[]) => items.join(" or ");

/** Page heading (h1) for the shop, based on what the visitor filtered. */
export function shopTitle(f: ProductFilters): string {
  if (f.q) return `Search results for “${f.q}”`;
  const parts: string[] = [];
  if (f.type === "new") parts.push("New");
  if (f.type === "used") parts.push("Used");
  if (f.pta.length) parts.push(or(f.pta.map(ptaLabel)));
  if (f.condition.length) parts.push(or(f.condition.map(conditionShort)));
  if (f.brand.length) parts.push(or(f.brand));
  if (parts.length === 0) return "Shop phones";
  return `${parts.join(" ")} phones`;
}

export function shopDescription(f: ProductFilters, shopName: string): string {
  const what = shopTitle(f).toLowerCase();
  return metaDescription(
    `Browse ${what} at ${shopName}. Compare condition, PTA status and price, then order online with cash on delivery.`,
  );
}

const hasSeveral = (f: ProductFilters) => [f.brand, f.condition, f.pta].some((list) => list.length > 1);

/** Only single choices make a page worth indexing; searches, prices, storage, sorting and mixed choices are noise. */
export function shopIsIndexable(f: ProductFilters): boolean {
  return !f.q && f.storage.length === 0 && f.minPrice === null && f.maxPrice === null && f.sort === "newest" && !hasSeveral(f);
}

/** Canonical address of a filtered shop page: the same page without noise filters. A mix of several choices points to the main shop page. */
export function shopCanonicalPath(f: ProductFilters): string {
  if (hasSeveral(f)) return "/shop";
  const clean: ProductFilters = { ...f, q: "", storage: [], minPrice: null, maxPrice: null, sort: "newest" };
  return `/shop${filtersToQuery(clean)}`;
}
