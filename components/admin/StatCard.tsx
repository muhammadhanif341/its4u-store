import Link from "next/link";
import { Icon, type IconName } from "@/components/Icons";
import { TONE, type Tone } from "@/lib/ui";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  href,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  tone: Tone;
  href: string;
  testId: string;
}) {
  return (
    <Link href={href} className="group card flex items-start gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${TONE[tone]}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <p className="mt-1 font-display text-[1.75rem] font-bold leading-none tracking-tight text-ink-900" data-testid={testId}>
          {value}
        </p>
        {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      </div>
    </Link>
  );
}
