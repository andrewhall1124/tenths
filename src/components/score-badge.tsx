import { formatScore, scoreColor } from "@/lib/score";

const sizes = {
  sm: "text-lg w-12 h-9",
  md: "text-2xl w-16 h-12",
  lg: "text-5xl w-28 h-20",
  xl: "text-7xl w-40 h-28",
} as const;

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      className={`tnum inline-flex items-center justify-center rounded-xl font-bold leading-none tabular-nums ${sizes[size]}`}
      style={{
        color: scoreColor(score),
        backgroundColor: "color-mix(in srgb, var(--surface-2) 85%, transparent)",
        border: `1px solid color-mix(in srgb, ${scoreColor(score)} 35%, transparent)`,
      }}
    >
      {formatScore(score)}
    </span>
  );
}
