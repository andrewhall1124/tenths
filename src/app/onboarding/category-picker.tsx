"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, toggleCategory } from "@/app/actions";

type Cat = {
  id: number;
  name: string;
  emoji: string;
  selected: boolean;
};

export function CategoryPicker({
  categories,
  alreadyOnboarded,
}: {
  categories: Cat[];
  alreadyOnboarded: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(categories.filter((c) => c.selected).map((c) => c.id)),
  );
  const [saving, startSaving] = useTransition();

  function toggle(id: number) {
    const next = new Set(selected);
    const on = !next.has(id);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
    // Persist optimistically; the set already reflects the new state.
    startSaving(() => {
      toggleCategory(id, on);
    });
  }

  function finish() {
    startSaving(async () => {
      await completeOnboarding();
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {categories.map((c) => {
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border text-sm transition ${
                on
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-surface text-muted"
              }`}
            >
              <span className="text-3xl">{c.emoji}</span>
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-24 flex justify-center">
        <button
          onClick={finish}
          disabled={saving || selected.size === 0}
          className="w-full max-w-xs rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink disabled:opacity-40"
        >
          {selected.size === 0
            ? "Pick at least one"
            : alreadyOnboarded
              ? "Save"
              : `Continue with ${selected.size}`}
        </button>
      </div>
    </div>
  );
}
