import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getAllCategories, getCategoriesWithMembership } from "@/lib/queries";
import { RateForm } from "./rate-form";

export default async function RatePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; place?: string; name?: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const sp = await searchParams;
  const withMembership = await getCategoriesWithMembership(user.id);
  const all = await getAllCategories();

  // Offer the user's palate first, then everything else.
  const mine = withMembership.filter((c) => c.selected);
  const categories = mine.length > 0 ? mine : all;

  const preset = {
    categorySlug: sp.category ?? null,
    placeId: sp.place ? Number(sp.place) : null,
    name: sp.name ?? null,
  };

  return (
    <div className="space-y-5 py-2">
      <h1 className="text-2xl font-bold">Rate something</h1>
      <RateForm
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          emoji: c.emoji,
        }))}
        placesApiEnabled={!!process.env.GOOGLE_PLACES_API_KEY}
        preset={preset}
      />
    </div>
  );
}
