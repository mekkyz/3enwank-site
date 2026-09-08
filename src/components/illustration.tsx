/** Hero drawing: a hosted site with the four things every account gets. Theme-aware through CSS variables; the nodes drift slowly. */
export function HeroIllustration({ labels, title }: { labels: [string, string, string, string]; title: string }) {
  const node = (x: number, y: number, icon: "sites" | "shield" | "mail" | "db", drift: string) => (
    <g transform={`translate(${x} ${y})`}>
      <g className={drift}>
        <circle cx="50" cy="40" r="40" fill="var(--illus-node)" stroke="var(--illus-node-line)" strokeWidth="2.5" />
        {icon === "sites" ? <path d="M34 40h32M50 24v32" stroke="#2a95c5" strokeWidth="4" strokeLinecap="round" /> : null}
        {icon === "shield" ? <path d="M50 22l18 8v12c0 12-8 20-18 24-10-4-18-12-18-24V30z" fill="none" stroke="#9b7fc9" strokeWidth="3.5" strokeLinejoin="round" /> : null}
        {icon === "mail" ? (
          <>
            <path d="M30 30h40v22H30z" fill="none" stroke="#2a95c5" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M30 30l20 14 20-14" fill="none" stroke="#2a95c5" strokeWidth="3.5" strokeLinejoin="round" />
          </>
        ) : null}
        {icon === "db" ? (
          <>
            <ellipse cx="50" cy="28" rx="18" ry="7" fill="none" stroke="#9b7fc9" strokeWidth="3.5" />
            <path d="M32 28v22c0 4 8 7 18 7s18-3 18-7V28M32 39c0 4 8 7 18 7s18-3 18-7" fill="none" stroke="#9b7fc9" strokeWidth="3.5" />
          </>
        ) : null}
      </g>
    </g>
  );
  const label = (x: number, y: number, text: string) => (
    <text x={x} y={y} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--illus-label)" fontFamily="inherit">
      {text}
    </text>
  );
  return (
    <svg viewBox="0 0 600 440" className="h-auto w-full max-w-[560px]" role="img" aria-label={title} direction="ltr">
      <circle cx="300" cy="220" r="200" fill="var(--illus-bg)" />
      <circle className="spin-slow" cx="300" cy="220" r="140" fill="none" stroke="var(--illus-ring)" strokeWidth="1.5" strokeDasharray="6 8" />
      <path d="M300 220L120 110M300 220l180-110M300 220L120 340M300 220l180 120" stroke="var(--illus-link)" strokeWidth="2" />
      <rect x="190" y="150" width="220" height="140" rx="14" fill="var(--illus-node)" stroke="var(--illus-node-line)" strokeWidth="2.5" />
      {/* The window's title bar: flat brand purple, not a purple-to-blue ramp. */}
      <rect x="190" y="150" width="220" height="34" rx="14" fill="var(--color-brand-ink)" />
      <circle cx="210" cy="167" r="5" fill="#ffffff" />
      <circle cx="228" cy="167" r="5" fill="#ffffff" />
      <circle cx="246" cy="167" r="5" fill="#ffffff" />
      <rect x="210" y="204" width="120" height="12" rx="6" fill="var(--illus-bar)" />
      <rect x="210" y="228" width="180" height="10" rx="5" fill="var(--illus-bar-2)" />
      <rect x="210" y="248" width="150" height="10" rx="5" fill="var(--illus-bar-2)" />
      <rect x="336" y="200" width="54" height="22" rx="6" fill="#7c5fa5" />
      {node(70, 70, "sites", "drift")}
      {node(430, 70, "shield", "drift-2")}
      {node(70, 300, "mail", "drift-2")}
      {node(430, 300, "db", "drift")}
      {label(120, 60, labels[0])}
      {label(480, 60, labels[1])}
      {label(120, 405, labels[2])}
      {label(480, 405, labels[3])}
    </svg>
  );
}
