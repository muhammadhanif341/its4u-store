import Link from "next/link";
import { Icon } from "./Icons";

export function SectionHeading({
  eyebrow,
  title,
  text,
  href,
  hrefLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="section-title mt-2">{title}</h2>
        {text && <p className="mt-3 text-lead text-body">{text}</p>}
      </div>
      {href && (
        <Link href={href} className="btn-ghost shrink-0">
          {hrefLabel}
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
