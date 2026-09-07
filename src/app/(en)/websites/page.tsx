import { screens } from "@/screens";

export const metadata = screens.websites.metadata("en");

export default function Page() {
  return screens.websites.render("en");
}
