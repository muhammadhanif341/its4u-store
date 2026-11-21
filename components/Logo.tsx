import { Icon } from "./Icons";

export function Logo({ name, light = false }: { name: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow">
        <Icon name="phone" className="h-5 w-5" strokeWidth={2.1} />
        <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent-400 ring-2 ${light ? "ring-ink-900" : "ring-white"}`} />
      </span>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>{name}</span>
    </span>
  );
}
