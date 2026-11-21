import { conditionShort, ptaLabel } from "@/lib/constants";
import { CONDITION_TONE, PTA_TONE, toneFor } from "@/lib/ui";

export function ConditionBadge({ value }: { value: string }) {
  return (
    <span className={`badge ${toneFor(CONDITION_TONE, value)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {conditionShort(value)}
    </span>
  );
}

export function PtaBadge({ value }: { value: string }) {
  return <span className={`badge ${toneFor(PTA_TONE, value)}`}>{ptaLabel(value)}</span>;
}
