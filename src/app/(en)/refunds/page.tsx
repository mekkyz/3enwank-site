import { screens } from "@/screens";

// A function, not a constant: this screen's metadata reads the catalogue (screens/legal.tsx).
export function generateMetadata() {
  return screens.refunds.metadata("en");
}

export default function Page() {
  return screens.refunds.render("en");
}
