/**
 * Cloudflare Turnstile on the two public AI endpoints. The site key is public and arrives from the
 * store's catalogue, so rotating the pair never needs a rebuild of this site; when the store reports
 * no key the challenge is off and everything here is a no-op.
 *
 * The widget is invisible and executed on demand: a token is minted when the visitor actually sends
 * something, not on page load, so a reader who never opens the chat costs nothing and sees nothing.
 * Tokens are single use, so the widget is reset after each one.
 */
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TIMEOUT_MS = 20_000;

type Turnstile = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  execute(id: string, opts?: Record<string, unknown>): void;
  reset(id?: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<Turnstile | null> | null = null;
let widgetId: string | null = null;
let host: HTMLDivElement | null = null;
let pending: { resolve: (token: string | null) => void } | null = null;

function loadScript(): Promise<Turnstile | null> {
  if (loading) return loading;
  loading = new Promise<Turnstile | null>((resolve) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile ?? null);
    // A blocked or failed script must not break the widget: the request goes without a token and
    // the store decides what to do with it.
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return loading;
}

function settle(token: string | null): void {
  const waiter = pending;
  pending = null;
  waiter?.resolve(token);
}

/** A fresh token, or null when Turnstile is off, blocked, or did not answer in time. */
export async function turnstileToken(siteKey: string | null): Promise<string | null> {
  if (!siteKey || typeof window === "undefined") return null;
  const turnstile = await loadScript();
  if (!turnstile) return null;

  if (!host) {
    host = document.createElement("div");
    host.style.display = "none";
    document.body.appendChild(host);
  }
  if (widgetId === null) {
    widgetId = turnstile.render(host, {
      sitekey: siteKey,
      execution: "execute",
      appearance: "interaction-only",
      callback: (token: string) => settle(token),
      "error-callback": () => settle(null),
      "timeout-callback": () => settle(null),
    });
  }

  // One in flight at a time: a second send while the first is unresolved would race the callback.
  if (pending) return null;
  return new Promise<string | null>((resolve) => {
    const timer = window.setTimeout(() => settle(null), TIMEOUT_MS);
    pending = {
      resolve: (token) => {
        window.clearTimeout(timer);
        resolve(token);
      },
    };
    try {
      turnstile.reset(widgetId!);
      turnstile.execute(widgetId!);
    } catch {
      settle(null);
    }
  });
}
