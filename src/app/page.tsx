import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getAllCategories, getMapPlaces } from "@/lib/queries";
import { MapExplorer } from "./map-explorer";

export const dynamic = "force-dynamic";

export default async function ExploreHome() {
  const user = await getOrCreateUser();

  // New signed-in users still get funneled through onboarding.
  if (user && !user.onboardedAt) {
    redirect("/onboarding");
  }

  const [categories, places] = await Promise.all([
    getAllCategories(),
    getMapPlaces(),
  ]);

  return (
    <MapExplorer
      categories={categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        emoji: c.emoji,
      }))}
      places={places}
    />
  );
}
