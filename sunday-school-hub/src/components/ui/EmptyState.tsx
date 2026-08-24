import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-black/10 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
        <Icon className="h-6 w-6 text-twilight-200" />
      </div>
      <h4 className="font-display text-base font-semibold text-twilight-50">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-sm text-twilight-200">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
