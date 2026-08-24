import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  aurora: "border-aurora-500/30 bg-aurora-500/10 text-aurora-700",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  grow: "border-grow-500/30 bg-grow-500/10 text-grow-700",
  coral: "border-coral-500/30 bg-coral-500/10 text-coral-700",
  sky: "border-sky-400/50 bg-sky-400/10 text-sky-700",
  neutral: "border-black/15 bg-black/5 text-twilight-200",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
  className?: string;
}) {
  return <span className={cn("pill", styles[tone], className)}>{children}</span>;
}
