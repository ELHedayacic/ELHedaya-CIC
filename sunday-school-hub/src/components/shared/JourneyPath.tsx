import { motion } from "framer-motion";

interface Node {
  x: number;
  y: number;
  label: string;
  sub: string;
}

// Wider vertical swing than before, and peak/trough is now what decides
// which side the labels sit on (see below) — the old version anchored
// every node's label 34px above and its sub-label 46px below in raw SVG
// text, which looked fine in isolation but collided badly wherever a
// node's own two lines needed more room than that gave them.
const nodes: Node[] = [
  { x: 60, y: 290, label: "Register", sub: "Create a family profile" },
  { x: 250, y: 90, label: "Enroll", sub: "Placed in a class" },
  { x: 440, y: 290, label: "Attend", sub: "Weekly sessions" },
  { x: 630, y: 90, label: "Learn", sub: "Homework & memory work" },
  { x: 820, y: 290, label: "Grow", sub: "Badges & milestones" },
];

const VIEW_W = 880;
const VIEW_H = 380;

function pathD() {
  return nodes.reduce((acc, n, i) => {
    if (i === 0) return `M ${n.x} ${n.y}`;
    const prev = nodes[i - 1];
    const midX = (prev.x + n.x) / 2;
    return `${acc} C ${midX} ${prev.y}, ${midX} ${n.y}, ${n.x} ${n.y}`;
  }, "");
}

export function JourneyPath({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="absolute inset-0 h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#14966B" />
              <stop offset="50%" stopColor="#D2A44A" />
              <stop offset="100%" stopColor="#2AABA0" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <motion.path
            d={pathD()}
            stroke="url(#pathGrad)"
            strokeWidth="2"
            strokeDasharray="6 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />

          {nodes.map((n, i) => (
            <g key={n.label}>
              <motion.circle
                cx={n.x}
                cy={n.y}
                r="22"
                fill="rgba(20,150,107,0.10)"
                stroke="#14966B"
                strokeOpacity="0.4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.25, duration: 0.5, ease: "backOut" }}
              />
              <motion.circle
                cx={n.x}
                cy={n.y}
                r="6"
                fill="#D2A44A"
                filter="url(#glow)"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.75, 1] }}
                transition={{ delay: 0.4 + i * 0.25, duration: 0.5 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
              {/* gentle continuous pulse once revealed — the "live" glow */}
              <motion.circle
                cx={n.x}
                cy={n.y}
                r="6"
                fill="none"
                stroke="#D2A44A"
                strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                transition={{
                  delay: 1.2 + i * 0.25,
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
            </g>
          ))}
        </svg>

        {/* Text labels as real HTML, not SVG <text> — predictable line
            height and wrapping instead of hand-tuned baseline offsets.
            Labels sit on whichever side of the node has open space (above
            a peak, below a trough), radiating outward: title closer to
            the node, description further out. */}
        {nodes.map((n, i) => {
          const isPeak = n.y < VIEW_H / 2;
          return (
            <motion.div
              key={n.label}
              className="absolute -translate-x-1/2 whitespace-nowrap text-center"
              style={{
                left: `${(n.x / VIEW_W) * 100}%`,
                ...(isPeak
                  ? { bottom: `${100 - (n.y / VIEW_H) * 100}%`, marginBottom: 20 }
                  : { top: `${(n.y / VIEW_H) * 100}%`, marginTop: 20 }),
              }}
              initial={{ opacity: 0, y: isPeak ? 8 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.25, duration: 0.45 }}
            >
              {isPeak ? (
                <>
                  <p className="text-[11px] text-twilight-200">{n.sub}</p>
                  <p className="mt-0.5 font-display text-sm font-semibold text-twilight-50 sm:text-base">{n.label}</p>
                </>
              ) : (
                <>
                  <p className="font-display text-sm font-semibold text-twilight-50 sm:text-base">{n.label}</p>
                  <p className="mt-0.5 text-[11px] text-twilight-200">{n.sub}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
