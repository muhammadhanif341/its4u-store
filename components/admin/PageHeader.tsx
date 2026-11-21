export function PageHeader({
  title,
  kicker,
  text,
  actions,
}: {
  title: string;
  kicker?: string;
  text?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="text-sm font-semibold text-muted">{kicker}</p>}
        <h1 className="!text-[1.75rem] sm:!text-[2.125rem]">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-[15px] text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
