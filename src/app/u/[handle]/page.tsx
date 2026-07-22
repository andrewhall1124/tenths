import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/lib/auth";
import { getProfileByHandle, isFollowing } from "@/lib/queries";
import { RatingCard } from "@/components/rating-card";
import { FollowButton } from "@/components/follow-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) return { title: "Not found — Tenths" };
  return {
    title: `@${profile.user.handle} — Tenths`,
    description: `${profile.user.name ?? "@" + profile.user.handle}'s palate: ${profile.ratingCount} scores across ${profile.categories.length} categories.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [profile, viewer] = await Promise.all([
    getProfileByHandle(handle),
    getOrCreateUser(),
  ]);
  if (!profile) notFound();

  const isSelf = viewer?.id === profile.user.id;
  const following =
    viewer && !isSelf
      ? await isFollowing(viewer.id, profile.user.id)
      : false;

  return (
    <div className="space-y-6 py-2">
      <header className="flex items-center gap-4">
        {profile.user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.user.imageUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-2xl">
            {(profile.user.name ?? profile.user.handle)[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {profile.user.name && (
            <h1 className="truncate text-xl font-bold">{profile.user.name}</h1>
          )}
          <p className="text-sm text-muted">@{profile.user.handle}</p>
          <div className="mt-1 flex gap-3 text-xs text-muted">
            <span>
              <strong className="text-foreground">{profile.ratingCount}</strong>{" "}
              scores
            </span>
            <span>
              <strong className="text-foreground">
                {profile.followerCount}
              </strong>{" "}
              followers
            </span>
            <span>
              <strong className="text-foreground">
                {profile.followingCount}
              </strong>{" "}
              following
            </span>
          </div>
        </div>
        {viewer && !isSelf && (
          <FollowButton
            followeeId={profile.user.id}
            initialFollowing={following}
          />
        )}
      </header>

      {isSelf && (
        <div className="flex gap-2">
          <Link
            href="/settings"
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-center text-sm font-medium"
          >
            Settings
          </Link>
          <Link
            href="/onboarding"
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-center text-sm font-medium"
          >
            Categories
          </Link>
          <SignOutButton>
            <button className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-center text-sm font-medium text-muted">
              Sign out
            </button>
          </SignOutButton>
        </div>
      )}

      {profile.categories.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Palate</h2>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((c) => (
              <Link
                key={c.slug}
                href={`/explore/${c.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
              >
                {c.name} <span className="text-muted">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Scores</h2>
        {profile.ratings.length === 0 ? (
          <p className="text-sm text-muted">No scores yet.</p>
        ) : (
          <div className="space-y-2.5">
            {profile.ratings.map((item) => (
              <RatingCard key={item.ratingId} item={item} editable={isSelf} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
