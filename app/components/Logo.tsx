export function Logo({ tamaño = 40 }: { tamaño?: number }) {
  return (
    <svg
      width={tamaño}
      height={tamaño}
      viewBox="0 0 100 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="LazoDePlata"
    >
      <defs>
        <linearGradient id="lp" x1="14" y1="18" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5F5F7" />
          <stop offset="18%" stopColor="#E8E8EA" />
          <stop offset="32%" stopColor="#C8C8CC" />
          <stop offset="48%" stopColor="#9A9A9E" />
          <stop offset="68%" stopColor="#EDEEF0" />
          <stop offset="85%" stopColor="#B8B8BC" />
          <stop offset="100%" stopColor="#D8D8DC" />
        </linearGradient>
        <linearGradient id="rp" x1="52" y1="18" x2="86" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D8D8DC" />
          <stop offset="15%" stopColor="#B8B8BC" />
          <stop offset="32%" stopColor="#EDEEF0" />
          <stop offset="52%" stopColor="#9A9A9E" />
          <stop offset="68%" stopColor="#C8C8CC" />
          <stop offset="82%" stopColor="#E8E8EA" />
          <stop offset="100%" stopColor="#F5F5F7" />
        </linearGradient>
        <linearGradient id="cp" x1="46" y1="24" x2="54" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B0B0B4" />
          <stop offset="25%" stopColor="#E8E8EC" />
          <stop offset="50%" stopColor="#A8A8AC" />
          <stop offset="75%" stopColor="#D4D4D8" />
          <stop offset="100%" stopColor="#909094" />
        </linearGradient>
        <linearGradient id="lt" x1="22" y1="38" x2="45" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E6E6E8" />
          <stop offset="35%" stopColor="#B8B8BC" />
          <stop offset="65%" stopColor="#D8D8DC" />
          <stop offset="100%" stopColor="#9FA0A4" />
        </linearGradient>
        <linearGradient id="rt" x1="55" y1="38" x2="78" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E6E6E8" />
          <stop offset="35%" stopColor="#D8D8DC" />
          <stop offset="65%" stopColor="#B8B8BC" />
          <stop offset="100%" stopColor="#9FA0A4" />
        </linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Colas */}
      <path
        d="M 46 36 L 24 74 L 33 66 L 40 73 L 48 38 Z"
        fill="url(#lt)"
        filter="url(#sh)"
      />
      <path
        d="M 54 36 L 76 74 L 67 66 L 60 73 L 52 38 Z"
        fill="url(#rt)"
        filter="url(#sh)"
      />
      {/* Brillo colas */}
      <path d="M 44 42 L 30 66" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <path d="M 56 42 L 70 66" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.38" />

      {/* Lazos */}
      <path
        d="M 48 28 C 32 8, 6 14, 11 37 C 15 44, 34 40, 48 28 Z"
        fill="url(#lp)"
        filter="url(#sh)"
      />
      <path
        d="M 52 28 C 68 8, 94 14, 89 37 C 85 44, 66 40, 52 28 Z"
        fill="url(#rp)"
        filter="url(#sh)"
      />
      {/* Brillos lazos */}
      <path d="M 38 18 C 28 20, 18 24, 15 32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M 62 18 C 72 20, 82 24, 85 32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.42" />
      <path d="M 35 30 C 28 33, 20 36, 16 39" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.28" />

      {/* Nudo central */}
      <rect x="44.5" y="23.5" width="11" height="14" rx="3.5" fill="url(#cp)" filter="url(#sh)" />
      <rect x="44.5" y="23.5" width="11" height="14" rx="3.5" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.8" />
      {/* pliegue nudo */}
      <path d="M 48 26 C 50 30, 50 33, 48 36" stroke="#7A7A7E" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
