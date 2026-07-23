import { redirect } from "next/navigation";

// The category grid moved to the map on the home tab. Category leaderboards
// still live at /explore/[slug].
export default function ExploreIndex() {
  redirect("/");
}
