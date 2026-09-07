import type { ReactNode } from "react";
import { isolateDir } from "@/lib/bidi";

/** A value cell: Latin-only text is isolated LTR (bdi), Arabic text inherits the page direction. */
export function Val({ children, className = "" }: { children: string; className?: string }) {
  return (
    <bdi dir={isolateDir(children)} className={`tabular ${className}`}>
      {children}
    </bdi>
  );
}

/** Wrap arbitrary children as an isolated LTR run (prices rendered from numbers, hostnames). */
export function Ltr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={`tabular ${className}`}>
      {children}
    </bdi>
  );
}
