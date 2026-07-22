import Link from "next/link";
import { ScoreBadge } from "./score-badge";
import { PencilIcon } from "./icons";
import { formatDate } from "@/lib/time";
import type { FeedItem } from "@/lib/queries";

export function RatingCard({
  item,
  editable = false,
}: {
  item: FeedItem;
  editable?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
      <Link href={`/place/${item.placeId}`} className="shrink-0 self-center">
        <ScoreBadge score={item.score} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/place/${item.placeId}`}
            className="block truncate font-semibold"
          >
            {item.placeName}
          </Link>
          {editable && (
            <Link
              href={`/rate/${item.ratingId}/edit`}
              aria-label="Edit rating"
              className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-muted hover:text-foreground"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
        {item.placeAddress && (
          <p className="truncate text-xs text-muted">{item.placeAddress}</p>
        )}
        {item.note && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
            “{item.note}”
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Link href={`/u/${item.handle}`}>@{item.handle}</Link>
          <span>·</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
