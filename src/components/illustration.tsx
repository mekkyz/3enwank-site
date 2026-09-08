/**
 * Hero drawing: one hosted site, with the things that keep it running attached to it.
 *
 * It used to be a circle with four icons orbiting it on spokes, which is the illustration every
 * hosting company has. Worse, it said nothing: four disconnected symbols do not explain that the
 * backups belong to the site, or that the mail arrives because the same account is running.
 *
 * So the site is drawn once and drawn large, with the certificate on its address bar, the firewall
 * clipped to its corner, yesterday's backups stacked behind it and the mailbox sitting beside it.
 * One composition rather than four ornaments. Everything is a CSS variable, so it follows the theme,
 * and nothing moves.
 *
 * `labels` arrives in the order the home screen passes it: websites, firewall, email, backups.
 */
export function HeroIllustration({ labels, title }: { labels: [string, string, string, string]; title: string }) {
  const [siteLabel, firewallLabel, mailLabel, backupLabel] = labels;

  const caption = (x: number, y: number, text: string, anchor: "middle" | "start" | "end" = "middle") => (
    <text x={x} y={y} textAnchor={anchor} fontSize="15" fontWeight="700" fill="var(--illus-label)" fontFamily="inherit">
      {text}
    </text>
  );

  return (
    // direction="ltr": a browser window and an address bar read left to right in every language.
    <svg viewBox="0 0 600 440" className="h-auto w-full max-w-[560px]" role="img" aria-label={title} direction="ltr">
      {/* Behind everything: yesterday's copies, stacked and dated, tucked under the site they belong to. */}
      <g>
        <rect x="364" y="288" width="176" height="76" rx="13" fill="var(--illus-bg)" stroke="var(--illus-ring)" strokeWidth="2" />
        <rect x="352" y="302" width="176" height="76" rx="13" fill="var(--illus-bg)" stroke="var(--illus-ring)" strokeWidth="2" />
        <rect x="340" y="316" width="176" height="76" rx="13" fill="var(--illus-node)" stroke="var(--illus-node-line)" strokeWidth="2.5" />
        {/* A disc, because a backup is a copy of the disk. */}
        <ellipse cx="378" cy="342" rx="16" ry="6" fill="none" stroke="var(--color-brand)" strokeWidth="3" />
        <path d="M362 342v14c0 3.3 7.2 6 16 6s16-2.7 16-6v-14" fill="none" stroke="var(--color-brand)" strokeWidth="3" />
        <rect x="410" y="336" width="84" height="9" rx="4.5" fill="var(--illus-bar)" />
        <rect x="410" y="354" width="58" height="8" rx="4" fill="var(--illus-bar-2)" />
      </g>

      {/* The mailbox, beside the site rather than orbiting it: same account, same machine. */}
      <g>
        <rect x="48" y="316" width="172" height="76" rx="13" fill="var(--illus-node)" stroke="var(--illus-node-line)" strokeWidth="2.5" />
        <rect x="70" y="338" width="44" height="32" rx="4" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M70 338l22 16 22-16" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" />
        <rect x="130" y="342" width="68" height="9" rx="4.5" fill="var(--illus-bar)" />
        <rect x="130" y="360" width="46" height="8" rx="4" fill="var(--illus-bar-2)" />
      </g>

      {/* The site itself: the largest thing on the canvas, because it is what the customer bought. */}
      <g>
        <rect x="70" y="84" width="350" height="216" rx="16" fill="var(--illus-node)" stroke="var(--illus-node-line)" strokeWidth="2.5" />
        {/* Title bar: rounded at the top, square where it meets the page. */}
        <path d="M70 100a16 16 0 0 1 16-16h318a16 16 0 0 1 16 16v28H70z" fill="var(--color-brand-ink)" />
        <circle cx="92" cy="106" r="5" fill="#ffffff" opacity="0.9" />
        <circle cx="110" cy="106" r="5" fill="#ffffff" opacity="0.9" />
        <circle cx="128" cy="106" r="5" fill="#ffffff" opacity="0.9" />

        {/* The address bar, carrying the certificate every plan includes. */}
        <rect x="88" y="140" width="314" height="26" rx="13" fill="var(--illus-bg)" stroke="var(--illus-ring)" strokeWidth="1.5" />
        <path d="M107 152v-4a5 5 0 0 1 10 0v4" fill="none" stroke="var(--color-ok)" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="104" y="152" width="16" height="11" rx="2.5" fill="none" stroke="var(--color-ok)" strokeWidth="2.4" />
        <rect x="132" y="149" width="120" height="8" rx="4" fill="var(--illus-bar)" />

        {/* The page: a heading, two lines, a button and a picture. */}
        <rect x="88" y="188" width="140" height="14" rx="7" fill="var(--illus-bar)" />
        <rect x="88" y="218" width="180" height="9" rx="4.5" fill="var(--illus-bar-2)" />
        <rect x="88" y="236" width="146" height="9" rx="4.5" fill="var(--illus-bar-2)" />
        <rect x="88" y="262" width="104" height="22" rx="8" fill="var(--color-brand-ink)" />
        <rect x="282" y="188" width="120" height="96" rx="10" fill="var(--illus-bg)" stroke="var(--illus-ring)" strokeWidth="2" />
        <circle cx="312" cy="216" r="11" fill="var(--color-accent)" opacity="0.5" />
        <path d="M288 276l32-32 24 24 16-14 22 22z" fill="var(--color-accent)" opacity="0.32" />
      </g>

      {/* The firewall, clipped to the corner of the thing it protects. */}
      <g>
        <circle cx="452" cy="122" r="36" fill="var(--illus-node)" stroke="var(--illus-node-line)" strokeWidth="2.5" />
        <path d="M452 103l15 6.5v10.5c0 10-6.6 16.6-15 20-8.4-3.4-15-10-15-20V109.5z" fill="none" stroke="var(--color-brand)" strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M445.5 121.5l4.5 4.5 9.5-9.5" fill="none" stroke="var(--color-brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Two clean rows of captions, so no label ever sits on top of what it names. */}
      {caption(245, 62, siteLabel)}
      {caption(452, 62, firewallLabel)}
      {caption(134, 418, mailLabel)}
      {caption(428, 418, backupLabel)}
    </svg>
  );
}
