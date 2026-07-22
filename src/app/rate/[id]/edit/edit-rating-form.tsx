"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRating, updateRating } from "@/app/actions";
import { formatScore, scoreColor } from "@/lib/score";
import { toDateInputValue } from "@/lib/time";
import { TrashIcon } from "@/components/icons";

export function EditRatingForm({
  rating,
}: {
  rating: {
    ratingId: number;
    score: number;
    note: string | null;
    createdAt: string;
    placeId: number;
    placeName: string;
    placeAddress: string | null;
    categoryName: string;
  };
}) {
  const router = useRouter();
  const [score, setScore] = useState(rating.score);
  const [note, setNote] = useState(rating.note ?? "");
  const [date, setDate] = useState(() => toDateInputValue(rating.createdAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set("ratingId", String(rating.ratingId));
    fd.set("score", String(score));
    fd.set("date", date);
    if (note.trim()) fd.set("note", note.trim());
    start(async () => {
      try {
        await updateRating(fd);
        router.push(`/place/${rating.placeId}`);
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  function remove() {
    if (!confirm("Delete this rating? This can’t be undone.")) return;
    setError(null);
    startDelete(async () => {
      try {
        await deleteRating(rating.ratingId);
        router.push(`/place/${rating.placeId}`);
      } catch {
        setError("Couldn’t delete. Try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-3">
        <p className="text-xs text-muted">{rating.categoryName}</p>
        <p className="font-semibold">{rating.placeName}</p>
        {rating.placeAddress && (
          <p className="truncate text-xs text-muted">{rating.placeAddress}</p>
        )}
      </section>

      {/* Score */}
      <section className="space-y-3">
        <label className="text-sm font-medium text-muted">Your score</label>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5">
          <span
            className="tnum text-7xl font-black leading-none"
            style={{ color: scoreColor(score) }}
          >
            {formatScore(score)}
          </span>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: scoreColor(score) }}
          />
          <div className="flex w-full justify-between text-xs text-muted">
            <span>0.0</span>
            <span>10.0</span>
          </div>
        </div>
      </section>

      {/* Date */}
      <section className="space-y-2">
        <label className="text-sm font-medium text-muted">Date</label>
        <input
          type="date"
          value={date}
          max={toDateInputValue(new Date())}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:border-foreground"
        />
      </section>

      {/* Note */}
      <section className="space-y-2">
        <label className="text-sm font-medium text-muted">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={`What made it a ${formatScore(score)}?`}
          className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:border-foreground"
        />
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={save}
        disabled={pending || deleting}
        className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>

      <button
        onClick={remove}
        disabled={pending || deleting}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-red-500 disabled:opacity-40"
      >
        <TrashIcon className="h-4 w-4" />
        {deleting ? "Deleting…" : "Delete rating"}
      </button>
    </div>
  );
}
