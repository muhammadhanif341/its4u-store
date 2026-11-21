import type { Faq as FaqItem } from "@/lib/storefront";
import { Icon } from "./Icons";

/** Questions and answers that open and close. Works without JavaScript (native details element). */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="card divide-y divide-line overflow-hidden" data-testid="faq">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink-900 transition hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 sm:px-6">
            <span>{item.q}</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-open:rotate-45 group-open:bg-brand-600 group-open:text-white">
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
            </span>
          </summary>
          <p className="px-5 pb-5 text-[15px] leading-relaxed text-body sm:px-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
