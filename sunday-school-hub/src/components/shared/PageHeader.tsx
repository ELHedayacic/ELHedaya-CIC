export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        {eyebrow && <p className="font-mono text-xs uppercase tracking-widest text-aurora-600">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl font-semibold text-twilight-50 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-twilight-200">{description}</p>}
      </div>
      {action}
    </div>
  );
}
