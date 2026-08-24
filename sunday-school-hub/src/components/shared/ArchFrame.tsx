import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// A pointed two-centered arch (the classic mihrab/niche silhouette),
// double-lined in antique gold, with a small 8-point star rosette at the
// apex. Used to frame the school logo on auth screens as a recognizable,
// non-generic signature element rather than a plain icon-in-a-box.
export function ArchFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto", className)} style={{ width: 180, aspectRatio: "200 / 224" }}>
      <svg viewBox="0 0 200 224" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16,220 L16,108 Q16,28 100,8 Q184,28 184,108 L184,220"
          fill="none"
          stroke="#D2A44A"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M28,220 L28,110 Q28,40 100,22 Q172,40 172,110 L172,220"
          fill="none"
          stroke="#D2A44A"
          strokeWidth="1"
          opacity="0.32"
        />
        {/* small rosette ornament at the apex */}
        <g transform="translate(100,18)" opacity="0.7">
          <rect x="-5" y="-5" width="10" height="10" fill="none" stroke="#5FCE9E" strokeWidth="0.75" />
          <polygon points="0,-7 7,0 0,7 -7,0" fill="none" stroke="#D2A44A" strokeWidth="0.75" />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-6">{children}</div>
    </div>
  );
}
