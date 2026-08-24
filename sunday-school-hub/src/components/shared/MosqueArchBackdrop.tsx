export function MosqueArchBackdrop({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 700 900"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="arch-glow-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5D080" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#E3BE6E" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E3BE6E" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="arch-apex-glow" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#F5D080" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F5D080" stopOpacity="0" />
        </radialGradient>
        <filter id="soft-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* soft glow behind the arch apex */}
      <rect x="100" y="0" width="500" height="300" fill="url(#arch-apex-glow)" filter="url(#soft-blur)" />

      {/* outer arch */}
      <path
        d="M100,900 L100,320 Q100,70 350,30 Q600,70 600,320 L600,900"
        fill="none"
        stroke="#D2A44A"
        strokeWidth="2.5"
        opacity="0.75"
      />
      {/* inner arch */}
      <path
        d="M148,900 L148,335 Q148,125 350,90 Q552,125 552,335 L552,900"
        fill="none"
        stroke="#D2A44A"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* glowing vertical centerline running from the apex down through the composition */}
      <rect x="349" y="30" width="2" height="870" fill="url(#arch-glow-line)" />

      {/* small rosette at the apex */}
      <g transform="translate(350,30)" opacity="0.85">
        <circle r="7" fill="none" stroke="#F5D080" strokeWidth="1" />
        <circle r="2.5" fill="#F5D080" />
      </g>

      {/* mosque silhouette at the base */}
      <g fill="#050A07" opacity="0.9">
        {/* left minaret */}
        <rect x="222" y="770" width="12" height="90" />
        <path d="M228,770 L220,752 Q228,742 236,752 Z" />
        <circle cx="228" cy="738" r="3" />
        {/* right minaret */}
        <rect x="466" y="770" width="12" height="90" />
        <path d="M472,770 L464,752 Q472,742 480,752 Z" />
        <circle cx="472" cy="738" r="3" />
        {/* central dome base */}
        <rect x="300" y="812" width="100" height="48" />
        {/* onion dome */}
        <path d="M310,812 Q308,760 328,738 Q340,724 350,706 Q360,724 372,738 Q392,760 390,812 Z" />
        {/* finial */}
        <rect x="348.5" y="678" width="3" height="28" />
        <circle cx="350" cy="674" r="4" />
      </g>
    </svg>
  );
}
