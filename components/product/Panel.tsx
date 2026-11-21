import { Icon, type IconName } from "../Icons";

/** A titled box, like a panel in a CRM record: icon, title, optional note on the right, then the content. */
export function Panel({
  id,
  title,
  icon,
  note,
  children,
}: {
  id: string;
  title: string;
  icon: IconName;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="card scroll-mt-44 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {title}
          </h2>
        </div>
        {note && <p className="hidden text-sm text-muted sm:block">{note}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A thin bar that shows how full something is (grade out of 10, battery health). */
export function Meter({ label, value, max = 100, display }: { label: string; value: number; max?: number; display: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        <span className="font-semibold text-ink-900">{display}</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
