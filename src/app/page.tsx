import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/lib/auth";
import { getFollowingFeed, getGlobalFeed } from "@/lib/queries";
import { RatingCard } from "@/components/rating-card";

export default async function HomePage() {
  const user = await getOrCreateUser();

  if (!user) {
    return <Landing />;
  }

  if (!user.onboardedAt) {
    redirect("/onboarding");
  }

  const [followingFeed, globalFeed] = await Promise.all([
    getFollowingFeed(user.id),
    getGlobalFeed(20),
  ]);

  // Cold start: if you follow no one yet, show the global feed instead.
  const feed = followingFeed.length > 1 ? followingFeed : globalFeed;
  const isGlobal = feed === globalFeed;

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
              Follow people to personalize this. Here’s what everyone’s rating.
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

function Landing() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="tnum text-8xl font-black tracking-tight">
        <span className="text-accent">8.4</span>
      </div>
      <h1 className="mt-4 text-4xl font-black tracking-tight">Tenths</h1>
      <p className="mt-2 max-w-xs text-muted">
        Everything, out of ten. Rate the things you love from 0.0 to 10.0,
        build your palate, and see what your friends think.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <SignUpButton mode="modal">
          <button className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink">
            Get started
          </button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button className="w-full rounded-full border border-border px-6 py-3 font-semibold">
            I already have an account
          </button>
        </SignInButton>
        <Link
          href="/explore"
          className="mt-1 text-sm text-muted hover:text-accent"
        >
          Just browsing? Explore →
        </Link>
      </div>
    </div>
  );
}
