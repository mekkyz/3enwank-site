import { screens } from "@/screens";

export const metadata = screens.home.metadata("en");

export default function Page() {
  return screens.home.render("en");
}
