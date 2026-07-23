import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getFollowingFeed, getGlobalFeed } from "@/lib/queries";
import { RatingCard } from "@/components/rating-card";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getOrCreateUser();

  if (user && !user.onboardedAt) {
    redirect("/onboarding");
  }

  let feed;
  let isGlobal;
  if (user) {
    const [followingFeed, globalFeed] = await Promise.all([
      getFollowingFeed(user.id),
      getGlobalFeed(20),
    ]);
    // Cold start: if you follow no one yet, show the global feed instead.
    feed = followingFeed.length > 1 ? followingFeed : globalFeed;
    isGlobal = feed === globalFeed;
  } else {
    // Signed-out visitors can still browse the latest scores.
    feed = await getGlobalFeed(20);
    isGlobal = true;
  }

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">
          {isGlobal ? "Fresh scores" : "Your feed"}
        </h1>
        <Link href="/rate" className="text-sm font-medium text-accent">
          + Rate
        </Link>
      </header>

      {feed.length === 0 ? (
        <EmptyFeed />
      ) : (
        <>
          {isGlobal && (
            <p className="text-sm text-muted">
              {user
                ? "Follow people to personalize this. Here’s what everyone’s rating."
                : "The latest scores from everyone."}
            </p>
          )}
          <div className="space-y-2.5">
            {feed.map((item) => (
              <RatingCard key={item.ratingId} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center">
      <div className="tnum text-4xl font-black tracking-tight">0.0</div>
      <h2 className="mt-3 font-semibold">No scores yet</h2>
      <p className="mt-1 text-sm text-muted">
        Be the first — rate something you love out of ten.
      </p>
      <Link
        href="/rate"
        className="mt-4 inline-block rounded-full bg-accent px-5 py-2 font-semibold text-accent-ink"
      >
        Add a rating
      </Link>
    </div>
  );
}
