/** An on/off switch built on a real checkbox. */
export function Toggle({
  name,
  label,
  text,
  defaultChecked,
}: {
  name: string;
  label: string;
  text?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl p-1">
      <span>
        <span className="block text-[15px] font-semibold text-ink-900">{label}</span>
        {text && <span className="mt-0.5 block text-sm text-muted">{text}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="switch mt-0.5" aria-hidden="true" />
    </label>
  );
}
