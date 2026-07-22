"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions";
import { CameraIcon } from "./icons";

// Resize/crop any picked image to a small square JPEG data URL so it fits in
// the users.image_url column without needing external blob storage.
async function fileToAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileEditor({
  initial,
  saveLabel = "Save",
}: {
  initial: { handle: string; name: string | null; imageUrl: string | null };
  saveLabel?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState(initial.handle);
  const [name, setName] = useState(initial.name ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setImageUrl(await fileToAvatar(file));
      setSaved(false);
    } catch {
      setError("Couldn’t read that image.");
    }
  }

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateProfile({ handle: handle.trim(), name, imageUrl });
      if ("error" in res) {
        setError(res.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2"
          aria-label="Change profile picture"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted">
              {(name || handle)[0]?.toUpperCase()}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-foreground/70 py-1 text-background">
            <CameraIcon className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
        <div className="min-w-0 text-sm text-muted">
          Tap the photo to change it.
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted">Username</label>
        <div className="flex items-center rounded-xl border border-border bg-surface px-3 focus-within:border-foreground">
          <span className="text-muted">@</span>
          <input
            value={handle}
            onChange={(e) =>
              setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            maxLength={20}
            placeholder="username"
            className="w-full bg-transparent py-2.5 pl-0.5 outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Your name (optional)"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:border-foreground"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={save}
        disabled={pending || handle.trim().length < 3}
        className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink disabled:opacity-40"
      >
        {pending ? "Saving…" : saved ? "Saved ✓" : saveLabel}
      </button>
    </div>
  );
}
