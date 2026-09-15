"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { waHref, withPlan } from "@/lib/whatsapp";

/*
 * What a plan or package page asked the contact page to open with (?need=website&plan=Business).
 *
 * Read in the browser, not on the server: every page here is cached HTML, and reading the query on
 * the server would render /contact/ per request (lib/i18n.ts contactHref). The address bar is an
 * external store: the server snapshot is empty, which is what the cached HTML says, and the client
 * snapshot fills in after hydration without a setState in an effect.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const getSearch = () => window.location.search;
const getServerSearch = () => "";

export type ContactQuery = { need: string | null; plan: string | null; note: string | null };

export function useContactQuery(): ContactQuery {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const query = new URLSearchParams(search);
  // Cut to a package name's length: the value goes into a WhatsApp line and a 300-character note.
  const plan = (query.get("plan") ?? "").trim().slice(0, 80) || null;
  // The assistant's question, handed to the form (S8). Cut to the note's own 300: the form sends no more.
  const note = (query.get("note") ?? "").trim().slice(0, 300) || null;
  return { need: query.get("need"), plan, note };
}

/**
 * A WhatsApp button whose first line names the plan the visitor came from, when there is one
 * (contact.wa.planText), and the general first line otherwise. Without JavaScript it keeps the
 * general line the server rendered.
 */
export function WaLink({
  number,
  text,
  planText,
  className,
  children,
}: {
  number: string;
  text: string;
  planText?: string;
  className?: string;
  children: ReactNode;
}) {
  const { plan } = useContactQuery();
  const href = waHref(number, plan && planText ? withPlan(planText, plan) : text);
  return (
    <a href={href} rel="noopener" target="_blank" className={className}>
      {children}
    </a>
  );
}
