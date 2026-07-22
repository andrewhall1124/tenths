"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions";

export function FollowButton({
  followeeId,
  initialFollowing,
}: {
  followeeId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => {
        setFollowing((f) => !f);
        start(() => toggleFollow(followeeId));
      }}
      disabled={pending}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        following
          ? "border border-border bg-surface text-muted"
          : "bg-accent text-accent-ink"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
