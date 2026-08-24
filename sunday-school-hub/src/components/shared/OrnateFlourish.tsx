import { cn } from "@/lib/utils";

export function OrnateFlourish({
  className,
  lineClassName,
  variant = "light",
}: {
  className?: string;
  lineClassName?: string;
  /** "dark" = light gold, for use on the auth pages' dark card. "light" (default) = deep gold, for the rest of the now-light app. */
  variant?: "dark" | "light";
}) {
  const iconColor = variant === "dark" ? "text-amber-400" : "text-amber-700";
  const lineColor = variant === "dark" ? "to-amber-500/60" : "to-amber-700/50";

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <span className={cn(`h-px w-10 bg-gradient-to-r from-transparent ${lineColor} sm:w-16`, lineClassName)} />
      <svg viewBox="0 0 32 32" className={cn("h-5 w-5 shrink-0", iconColor)} fill="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={i}
            cx="16"
            cy="8"
            rx="2.6"
            ry="6.5"
            fill="currentColor"
            fillOpacity="0.85"
            transform={`rotate(${i * 45} 16 16)`}
          />
        ))}
        <circle cx="16" cy="16" r="2.4" fill="currentColor" />
      </svg>
      <span className={cn(`h-px w-10 bg-gradient-to-l from-transparent ${lineColor} sm:w-16`, lineClassName)} />
    </div>
  );
}
