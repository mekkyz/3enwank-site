import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Locale, PageKey } from "@/lib/i18n";
import { about } from "./about";
import { care } from "./care";
import { domains } from "./domains";
import { home } from "./home";
import { hosting } from "./hosting";
import { delivery, privacy, refunds, terms } from "./legal";
import { websites } from "./websites";

/** Query parameters a screen may care about. Only the domain search uses them today. */
export type ScreenParams = { q?: string; added?: string };
export type Screen = { metadata(locale: Locale): Metadata; render(locale: Locale, params?: ScreenParams): Promise<ReactNode> };

export const screens: Record<PageKey, Screen> = { home, hosting, websites, care, domains, about, terms, privacy, delivery, refunds };
