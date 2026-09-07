/** Wordmark as inline SVG: no image request, scales with the header, inherits the text colour. */
export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 132 28" role="img" aria-label="3enwank" xmlns="http://www.w3.org/2000/svg" direction="ltr" style={{ direction: "ltr" }}>
      <rect x="0" y="2" width="24" height="24" rx="6" fill="var(--color-brand)" />
      <path d="M7 9.5h10M7 14h10M7 18.5h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <text x="30" y="20.5" fontFamily="Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif" fontSize="19" fontWeight="700" fill={light ? "#fff" : "var(--color-ink)"} letterSpacing="-0.4">
        <tspan fill="var(--color-brand)">3en</tspan>wank
      </text>
    </svg>
  );
}
