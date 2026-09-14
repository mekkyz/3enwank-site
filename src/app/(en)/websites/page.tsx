import { screens } from "@/screens";

// A function rather than a constant, like every page here: a screen's metadata may be async (screens/index.ts).
export function generateMetadata() {
  return screens.websites.metadata("en");
}

export default function Page() {
  return screens.websites.render("en");
}
