"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRating, saveRating, updateRating } from "@/app/actions";
import { formatScore, scoreColor } from "@/lib/score";
import { toDateInputValue } from "@/lib/time";
import { fileToPhotoDataUrl } from "@/lib/image";
import { CameraIcon, TrashIcon } from "@/components/icons";

type Category = { id: number; slug: string; name: string; emoji: string };

type ChosenPlace =
  | { kind: "existing"; placeId: number; name: string }
  | {
      kind: "google";
      googlePlaceId: string;
      name: string;
      address: string | null;
      lat: number | null;
      lng: number | null;
    }
  | { kind: "manual"; name: string };

type Suggestion = {
  googlePlaceId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

type EditState = {
  ratingId: number;
  categoryId: number;
  score: number;
  note: string | null;
  photoUrl: string | null;
  date: string;
  place: { placeId: number; name: string };
};

export function RateForm({
  categories,
  placesApiEnabled,
  preset,
  edit,
}: {
  categories: Category[];
  placesApiEnabled: boolean;
  preset: { categorySlug: string | null; placeId: number | null; name: string | null };
  edit?: EditState;
}) {
  const router = useRouter();
  const isEdit = !!edit;
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialCat = edit
    ? categories.find((c) => c.id === edit.categoryId) ?? categories[0]
    : categories.find((c) => c.slug === preset.categorySlug) ?? categories[0];
  const [categoryId, setCategoryId] = useState<number>(initialCat?.id ?? 0);

  const [place, setPlace] = useState<ChosenPlace | null>(
    edit
      ? { kind: "existing", placeId: edit.place.placeId, name: edit.place.name }
      : preset.placeId && preset.name
        ? { kind: "existing", placeId: preset.placeId, name: preset.name }
        : null,
  );
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);

  const [score, setScore] = useState(edit?.score ?? 7.5);
  const [note, setNote] = useState(edit?.note ?? "");
  const [photo, setPhoto] = useState<string | null>(edit?.photoUrl ?? null);
  const [date, setDate] = useState(() =>
    toDateInputValue(edit?.date ?? new Date()),
  );
  const photoRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setPhoto(await fileToPhotoDataUrl(file));
    } catch {
      setError("Couldn’t read that image.");
    }
  }

  // Lock the place only when creating a rating for a specific place (from the
  // place page). When editing, the location is always changeable.
  const lockPlace = !isEdit && !!preset.placeId;

  // Debounced Google Places search.
  useEffect(() => {
    if (place || !placesApiEnabled || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, place, placesApiEnabled]);

  function submit() {
    if (!categoryId || !place) return;
    setError(null);
    const fd = new FormData();
    fd.set("categoryId", String(categoryId));
    fd.set("score", String(score));
    if (date) fd.set("date", date);
    if (note.trim()) fd.set("note", note.trim());
    // When editing, always send the field (empty clears an existing photo);
    // when creating, only send it if one was picked.
    if (isEdit) fd.set("photoUrl", photo ?? "");
    else if (photo) fd.set("photoUrl", photo);

    // An existing place is tied to its original category, so if the category
    // changed we must re-resolve it by name under the new category instead.
    const movedCategory =
      isEdit && place.kind === "existing" && categoryId !== edit!.categoryId;

    if (place.kind === "existing" && !movedCategory) {
      fd.set("existingPlaceId", String(place.placeId));
    } else if (place.kind === "google") {
      fd.set("googlePlaceId", place.googlePlaceId);
      fd.set("name", place.name);
      if (place.address) fd.set("address", place.address);
      if (place.lat != null) fd.set("lat", String(place.lat));
      if (place.lng != null) fd.set("lng", String(place.lng));
    } else {
      fd.set("name", place.name);
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          fd.set("ratingId", String(edit!.ratingId));
          const { placeId } = await updateRating(fd);
          router.push(`/place/${placeId}`);
        } else {
          const { placeId } = await saveRating(fd);
          router.push(`/place/${placeId}`);
        }
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  function remove() {
    if (!edit) return;
    if (!confirm("Delete this rating? This can’t be undone.")) return;
    setError(null);
    startDelete(async () => {
      try {
        await deleteRating(edit.ratingId);
        router.push("/feed");
      } catch {
        setError("Couldn’t delete. Try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Category */}
      <section className="space-y-2">
        <label className="text-sm font-medium text-muted">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                categoryId === c.id
                  ? "border-foreground bg-surface-2 text-foreground"
                  : "border-border bg-surface text-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Place */}
      <section className="space-y-2">
        <label className="text-sm font-medium text-muted">Place</label>
        {place ? (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{place.name}</p>
              {place.kind === "google" && place.address && (
                <p className="truncate text-xs text-muted">{place.address}</p>
              )}
            </div>
            {lockPlace ? null : (
              <button
                onClick={() => {
                  setPlace(null);
                  setQuery("");
                }}
                className="ml-3 shrink-0 text-sm text-muted hover:text-foreground"
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                placesApiEnabled ? "Search for a place…" : "Name of the place"
              }
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
            {searching && <p className="text-xs text-muted">Searching…</p>}
            {suggestions.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {suggestions.map((s) => (
                  <li key={s.googlePlaceId}>
                    <button
                      onClick={() =>
                        setPlace({ kind: "google", ...s })
                      }
                      className="block w-full px-3 py-2.5 text-left hover:bg-surface-2"
                    >
                      <span className="block truncate font-medium">
                        {s.name}
                      </span>
                      {s.address && (
                        <span className="block truncate text-xs text-muted">
                          {s.address}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim().length >= 1 && (
              <button
                onClick={() =>
                  setPlace({ kind: "manual", name: query.trim() })
                }
                className="text-sm text-accent"
              >
                + Add “{query.trim()}” manually
              </button>
            )}
          </div>
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
            className="w-full accent-accent"
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
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:border-accent"
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
          className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:border-accent"
        />
      </section>

      {/* Photo */}
      <section className="space-y-2">
        <label className="text-sm font-medium text-muted">Photo (optional)</label>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          onChange={onPickPhoto}
          className="hidden"
        />
        {photo ? (
          <div className="relative overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="w-full object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              aria-label="Remove photo"
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted"
          >
            <CameraIcon className="h-5 w-5" />
            Add a photo
          </button>
        )}
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || deleting || !place || !categoryId}
        className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink disabled:opacity-40"
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Save score"}
      </button>

      {isEdit && (
        <button
          onClick={remove}
          disabled={pending || deleting}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-red-500 disabled:opacity-40"
        >
          <TrashIcon className="h-4 w-4" />
          {deleting ? "Deleting…" : "Delete rating"}
        </button>
      )}
    </div>
  );
}
