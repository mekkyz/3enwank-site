import { screens } from "@/screens";

// A function, not a constant: this screen's metadata reads the catalogue (screens/legal.tsx).
export function generateMetadata() {
  return screens.privacy.metadata("en");
}

export default function Page() {
  return screens.privacy.render("en");
}
