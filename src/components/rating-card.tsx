import Link from "next/link";
import { ScoreBadge } from "./score-badge";
import { timeAgo } from "@/lib/time";
import type { FeedItem } from "@/lib/queries";

export function RatingCard({ item }: { item: FeedItem }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
      <Link href={`/place/${item.placeId}`} className="shrink-0 self-center">
        <ScoreBadge score={item.score} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/place/${item.placeId}`}
          className="block truncate font-semibold hover:text-accent"
        >
          <span className="mr-1">{item.categoryEmoji}</span>
          {item.placeName}
        </Link>
        {item.placeAddress && (
          <p className="truncate text-xs text-muted">{item.placeAddress}</p>
        )}
        {item.note && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
            “{item.note}”
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Link href={`/u/${item.handle}`} className="hover:text-accent">
            @{item.handle}
          </Link>
          <span>·</span>
          <span>{timeAgo(item.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
