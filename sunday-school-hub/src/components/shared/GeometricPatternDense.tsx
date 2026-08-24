// Denser, more visible version of the app-wide geometric backdrop —
// appropriate for large brand-forward areas of negative space (auth
// panels, the landing hero) rather than sitting subtly behind dense UI.
// Same construction as GeometricBackdrop: a square overlaid with the same
// square rotated 45° is the classic basis of an 8-point star lattice.
export function GeometricPatternDense({
  className,
  opacity = 0.09,
  id = "dense-lattice",
}: {
  className?: string;
  opacity?: number;
  id?: string;
}) {
  const tile = 120;
  const inset = tile * 0.1464;
  const half = tile / 2;

  return (
    <svg aria-hidden="true" className={className} style={{ opacity }}>
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <rect x={inset} y={inset} width={tile - inset * 2} height={tile - inset * 2} fill="none" stroke="#E3BE6E" strokeWidth="1" />
          <polygon points={`${half},0 ${tile},${half} ${half},${tile} 0,${half}`} fill="none" stroke="#5FCE9E" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
