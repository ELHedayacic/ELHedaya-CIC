import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "aurora" | "amber" | "grow" | "coral";
  hint?: string;
}

const accentMap = {
  aurora: "text-aurora-500 bg-aurora-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  grow: "text-grow-500 bg-grow-500/10",
  coral: "text-coral-700 bg-coral-500/10",
};

export function StatCard({ label, value, icon: Icon, accent = "aurora", hint }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-twilight-200">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-twilight-50">{value}</p>
          {hint && <p className="mt-1 font-mono text-xs text-twilight-200">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
