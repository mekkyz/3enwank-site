import { screens } from "@/screens";

// A function, not a constant: this screen's metadata reads the catalogue (screens/legal.tsx).
export function generateMetadata() {
  return screens.terms.metadata("en");
}

export default function Page() {
  return screens.terms.render("en");
}
