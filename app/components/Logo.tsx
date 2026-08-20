export function Logo({ tamaño = 40 }: { tamaño?: number }) {
  return (
    <svg
      width={tamaño}
      height={tamaño}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="LazoDePlata"
    >
      <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.15" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        d="M17 14c2.5 0 4 1.5 4 4 0 3-3 3-3 6 0 1.5 1 2.5 2 3.5M31 14c-2.5 0-4 1.5-4 4 0 3 3 3 3 6 0 1.5-1 2.5-2 3.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M22 34h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}