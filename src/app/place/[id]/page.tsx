import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getPlace, getPlaceRatings } from "@/lib/queries";
import { ScoreBadge } from "@/components/score-badge";
import { PencilIcon } from "@/components/icons";
import { formatScore } from "@/lib/score";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const placeId = Number(id);
  if (!Number.isInteger(placeId)) notFound();

  const place = await getPlace(placeId);
  if (!place) notFound();

  const [ratings, user] = await Promise.all([
    getPlaceRatings(placeId),
    getOrCreateUser(),
  ]);

  const myRating = user
    ? ratings.find((r) => r.userId === user.id)
    : undefined;

  return (
    <div className="space-y-6 py-2">
      <div className="text-sm text-muted">
        <Link href={`/explore/${place.categorySlug}`}>{place.categoryName}</Link>
      </div>

      <header className="flex items-center gap-4">
        {place.avgScore != null ? (
          <ScoreBadge score={place.avgScore} size="xl" />
        ) : (
          <div className="tnum flex h-28 w-40 items-center justify-center rounded-xl border border-border bg-surface text-3xl text-muted">
            —
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{place.name}</h1>
          {place.address && (
            <p className="mt-1 text-sm text-muted">{place.address}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {place.ratingCount === 0
              ? "No ratings yet"
              : `${place.ratingCount} ${
                  place.ratingCount === 1 ? "rating" : "ratings"
                } · avg ${formatScore(place.avgScore ?? 0)}`}
          </p>
        </div>
      </header>

      <Link
        href={
          myRating
            ? `/rate/${myRating.ratingId}/edit`
            : `/rate?place=${place.id}&category=${place.categorySlug}&name=${encodeURIComponent(
                place.name,
              )}`
        }
        className="block w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-ink"
      >
        {myRating ? `Edit your ${formatScore(myRating.score)}` : "Add your score"}
      </Link>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">
          Scores {ratings.length > 0 && `(${ratings.length})`}
        </h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-muted">
            Nobody’s scored this yet. Be the first.
          </p>
        ) : (
          <ul className="space-y-2">
            {ratings.map((r) => (
              <li
                key={r.ratingId}
                className={`flex gap-3 rounded-2xl border p-3 ${
                  r.userId === user?.id
                    ? "border-accent/50 bg-accent/5"
                    : "border-border bg-surface"
                }`}
              >
                <div className="self-center">
                  <ScoreBadge score={r.score} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/u/${r.handle}`} className="font-medium">
                        @{r.handle}
                        {r.userId === user?.id && (
                          <span className="ml-1 text-xs text-muted">(you)</span>
                        )}
                      </Link>
                      <span className="ml-2 text-xs text-muted">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    {r.userId === user?.id && (
                      <Link
                        href={`/rate/${r.ratingId}/edit`}
                        aria-label="Edit rating"
                        className="-mr-1 shrink-0 rounded-full p-1 text-muted hover:text-foreground"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                  {r.note && (
                    <p className="mt-0.5 text-sm text-foreground/90">
                      “{r.note}”
                    </p>
                  )}
                  {r.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photoUrl}
                      alt=""
                      className="mt-2 max-h-64 w-full rounded-xl border border-border object-cover"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
