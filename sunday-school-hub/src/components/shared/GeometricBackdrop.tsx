// A subtle, full-screen geometric backdrop built from real Islamic
// strapwork geometry: an axis-aligned square overlaid with the same square
// rotated 45° (vertices meeting at tile-edge midpoints) is the classic
// construction behind the 8-point star ("khatam") lattice seen in girih
// tilework. Tiled edge-to-edge, the diamonds link up into a continuous
// interlocking star grid. Rendered once, fixed, and very low-opacity so it
// reads as texture rather than decoration competing with content.
export function GeometricBackdrop() {
  const tile = 92;
  const inset = tile * 0.1464; // (1 - 1/sqrt(2)) * tile — makes the axis-aligned
  // square's corners land exactly on the rotated square's edges, so the two
  // interlock cleanly rather than just overlapping randomly.
  const half = tile / 2;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.05]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="girih-lattice" width={tile} height={tile} patternUnits="userSpaceOnUse">
          <rect
            x={inset}
            y={inset}
            width={tile - inset * 2}
            height={tile - inset * 2}
            fill="none"
            stroke="#E3BE6E"
            strokeWidth="1"
          />
          <polygon
            points={`${half},0 ${tile},${half} ${half},${tile} 0,${half}`}
            fill="none"
            stroke="#5FCE9E"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#girih-lattice)" />
    </svg>
  );
}
