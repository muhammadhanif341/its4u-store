import { conditionLabel, ptaLabel } from "./constants";

/** Public address of the site, from NEXT_PUBLIC_SITE_URL (no trailing slash). */
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path: string, base: string = siteUrl()): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Search engines read the first ~155 characters, so cut at a word boundary. */
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/, "")}…`;
}

/** schema.org only knows new and used. Everything that is not sealed and new counts as used. */
export function itemConditionUrl(condition: string): string {
  return condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition";
}

export function availabilityUrl(stock: number): string {
  return stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

type ProductForSeo = {
  slug: string;
  name: string;
  brand: string;
  model: string;
  condition: string;
  ptaStatus: string;
  price: number;
  stock: number;
  description: string;
  images: string[];
  warranty?: string;
};

/** Description text for a product page: its own description, or a sentence built from its details. */
export function productDescription(p: ProductForSeo): string {
  const own = p.description.trim();
  const facts = `${p.name}, ${conditionLabel(p.condition)}, ${ptaLabel(p.ptaStatus)}. Rs. ${p.price.toLocaleString("en-US")}.`;
  return metaDescription(own ? `${facts} ${own}` : `${facts} Order online with cash on delivery.`);
}

export function productJsonLd(p: ProductForSeo, opts: { shopName: string; base?: string }) {
  const base = opts.base ?? siteUrl();
  const url = absoluteUrl(`/shop/${p.slug}`, base);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.slug,
    brand: { "@type": "Brand", name: p.brand },
    model: p.model,
    description: productDescription(p),
    ...(p.images.length ? { image: p.images.map((i) => absoluteUrl(i, base)) } : {}),
    itemCondition: itemConditionUrl(p.condition),
    additionalProperty: [
      { "@type": "PropertyValue", name: "PTA status", value: ptaLabel(p.ptaStatus) },
      { "@type": "PropertyValue", name: "Condition", value: conditionLabel(p.condition) },
    ],
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PKR",
      price: String(p.price),
      availability: availabilityUrl(p.stock),
      itemCondition: itemConditionUrl(p.condition),
      seller: { "@type": "Organization", name: opts.shopName },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], base: string = siteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, base),
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function howToJsonLd(name: string, steps: { title: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text })),
  };
}

export function storeJsonLd(
  s: { shopName: string; tagline: string; phone: string; address: string },
  base: string = siteUrl(),
) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: s.shopName,
    description: s.tagline,
    url: base,
    telephone: s.phone,
    address: { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "PK" },
    priceRange: "Rs.",
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash on delivery",
  };
}

export function websiteJsonLd(shopName: string, base: string = siteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopName,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** Safe to put inside a <script> tag: "<" is escaped so data can never close the tag. */
export function jsonLdString(data: unknown): string {
  const backslash = String.fromCharCode(92);
  return JSON.stringify(data)
    .split("<").join(backslash + "u003c")
    .split(String.fromCharCode(0x2028)).join(backslash + "u2028")
    .split(String.fromCharCode(0x2029)).join(backslash + "u2029");
}
