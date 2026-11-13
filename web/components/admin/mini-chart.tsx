export function AreaSpark({
  points,
  color,
  fill,
}: {
  points: number[];
  color: string;
  fill: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 320;
  const h = 120;
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * w;
    const y = h - ((value - min) / (max - min || 1)) * (h - 16) - 8;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full">
      <polyline points={area} fill={fill} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Donut({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 96 96" className="size-24 shrink-0 -rotate-90 sm:size-28">
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const current = offset;
          offset += length;
          return (
            <circle
              key={slice.label}
              cx="48"
              cy="48"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={-current}
            />
          );
        })}
      </svg>
      <ul className="w-full space-y-1.5 text-xs">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: slice.color }} />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-semibold">{slice.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...items.map((item) => item.value));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
