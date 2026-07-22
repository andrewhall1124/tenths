import { notFound, redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getRatingForEdit } from "@/lib/queries";
import { EditRatingForm } from "./edit-rating-form";

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

  const rating = await getRatingForEdit(ratingId, user.id);
  if (!rating) notFound();

  return (
    <div className="space-y-5 py-2">
      <h1 className="text-2xl font-bold">Edit rating</h1>
      <EditRatingForm
        rating={{ ...rating, createdAt: rating.createdAt.toISOString() }}
      />
    </div>
  );
}
