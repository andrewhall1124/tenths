import { notFound, redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getAllCategories, getRatingForEdit } from "@/lib/queries";
import { RateForm } from "../../rate-form";

export const dynamic = "force-dynamic";

export default async function EditRatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ratingId = Number(id);
  if (!Number.isInteger(ratingId)) notFound();

  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [rating, categories] = await Promise.all([
    getRatingForEdit(ratingId, user.id),
    getAllCategories(),
  ]);
  if (!rating) notFound();

  return (
    <div className="space-y-5 py-2">
      <h1 className="text-2xl font-bold">Edit rating</h1>
      <RateForm
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          emoji: c.emoji,
        }))}
        placesApiEnabled={!!process.env.GOOGLE_PLACES_API_KEY}
        preset={{ categorySlug: null, placeId: null, name: null }}
        edit={{
          ratingId: rating.ratingId,
          categoryId: rating.categoryId,
          score: rating.score,
          note: rating.note,
          photoUrl: rating.photoUrl,
          date: rating.createdAt.toISOString(),
          place: { placeId: rating.placeId, name: rating.placeName },
        }}
      />
    </div>
  );
}
