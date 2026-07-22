import Link from "next/link";
import { getAllCategories, getGlobalFeed } from "@/lib/queries";
import { RatingCard } from "@/components/rating-card";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [categories, feed] = await Promise.all([
    getAllCategories(),
    getGlobalFeed(20),
  ]);

  return (
    <div className="space-y-6 py-2">
      <h1 className="text-2xl font-bold">Explore</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Categories</h2>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/explore/${c.slug}`}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface text-xs"
            >
              <span className="text-2xl">{c.emoji}</span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Fresh scores</h2>
        {feed.length === 0 ? (
          <p className="text-sm text-muted">Nothing rated yet.</p>
        ) : (
          <div className="space-y-2.5">
            {feed.map((item) => (
              <RatingCard key={item.ratingId} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
