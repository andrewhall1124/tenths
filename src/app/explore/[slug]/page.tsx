import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryLeaderboard } from "@/lib/queries";
import { ScoreBadge } from "@/components/score-badge";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { category, entries } = await getCategoryLeaderboard(slug);
  if (!category) notFound();

  return (
    <div className="space-y-5 py-2">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {category.emoji} {category.name}
        </h1>
        <Link
          href={`/rate?category=${category.slug}`}
          className="text-sm font-medium text-accent"
        >
          + Rate
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">
            No {category.name.toLowerCase()} rated yet. Be the first.
          </p>
          <Link
            href={`/rate?category=${category.slug}`}
            className="mt-3 inline-block rounded-full bg-accent px-5 py-2 font-semibold text-accent-ink"
          >
            Add a rating
          </Link>
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((e, i) => (
            <li key={e.placeId}>
              <Link
                href={`/place/${e.placeId}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="tnum w-6 shrink-0 text-center text-sm font-bold text-muted">
                  {i + 1}
                </span>
                <ScoreBadge score={e.avgScore} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.name}</p>
                  {e.address && (
                    <p className="truncate text-xs text-muted">{e.address}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {e.ratingCount}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
