import "@fontsource-variable/inter";
import "@fontsource-variable/noto-naskh-arabic";
import "../globals.css";
import type { ReactNode } from "react";
import { RootHtml } from "@/components/root";

/** Root layout of the English tree (the site root). Arabic has its own under [locale]. */
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="en">{children}</RootHtml>;
}
