import { jsonLdString } from "@/lib/seo";

/** Structured data for search engines (rich results for products, breadcrumbs and the shop). */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
