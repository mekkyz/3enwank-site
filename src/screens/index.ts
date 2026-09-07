import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Locale, PageKey } from "@/lib/i18n";
import { care } from "./care";
import { domains } from "./domains";
import { home } from "./home";
import { hosting } from "./hosting";
import { privacy, terms } from "./legal";
import { websites } from "./websites";

export type Screen = { metadata(locale: Locale): Metadata; render(locale: Locale): Promise<ReactNode> };

export const screens: Record<PageKey, Screen> = { home, hosting, websites, care, domains, terms, privacy };
