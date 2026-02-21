"use client";

export function ReportTimeSlider({
  minDate,
  maxDate,
  value,
  onChange,
  filteredCount,
  totalCount,
}: {
  minDate: number;
  maxDate: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  filteredCount: number;
  totalCount: number;
}) {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  };

  return (
    <div className="rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Time Range</span>
        <span className="font-semibold text-foreground">
          {formatDate(value[0])} — {formatDate(value[1])}
        </span>
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            From
          </label>
          <input
            type="range"
            min={minDate}
            max={maxDate}
            step={86400000 * 30}
            value={value[0]}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange([Math.min(v, value[1]), value[1]]);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            To
          </label>
          <input
            type="range"
            min={minDate}
            max={maxDate}
            step={86400000 * 30}
            value={value[1]}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange([value[0], Math.max(v, value[0])]);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
      </div>
      <div className="mt-2 text-center text-[11px] text-muted-foreground">
        Showing {filteredCount} of {totalCount} incidents
      </div>
    </div>
  );
}
