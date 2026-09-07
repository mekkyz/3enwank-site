import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "../globals.css";
import type { ReactNode } from "react";
import { RootHtml } from "@/components/root";

/** Root layout of the English tree (the site root). Arabic has its own under [locale]. */
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="en">{children}</RootHtml>;
}
