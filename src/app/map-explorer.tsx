"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MapPlace } from "@/lib/queries";

// Leaflet touches `window`, so the map itself must never render on the server.
const MapCanvas = dynamic(() => import("@/components/map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm text-muted">
      Loading map…
    </div>
  ),
});

type Cat = { slug: string; name: string; emoji: string };

export function MapExplorer({
  categories,
  places,
}: {
  categories: Cat[];
  places: MapPlace[];
}) {
  const [active, setActive] = useState<string>("all");

  const visible = useMemo(
    () =>
      active === "all"
        ? places
        : places.filter((p) => p.categorySlug === active),
    [active, places],
  );

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Explore</h1>
        <span className="text-sm text-muted">
          {visible.length} place{visible.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tab label="All" active={active === "all"} onClick={() => setActive("all")} />
        {categories.map((c) => (
          <Tab
            key={c.slug}
            label={`${c.emoji} ${c.name}`}
            active={active === c.slug}
            onClick={() => setActive(c.slug)}
          />
        ))}
      </div>

      <div className="h-[70vh] overflow-hidden rounded-2xl border border-border">
        {/* Remount when the filter changes so markers reset cleanly. */}
        <MapCanvas key={active} places={visible} />
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-border bg-surface text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
