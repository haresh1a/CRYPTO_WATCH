// Reusable loading skeletons. Keep them blocky and non-animated
// in places that should feel snappy; pulse only on initial loads.

export function TableSkeleton({ rows = 12 }: { rows?: number }) {
  return (
    <div className="space-y-1 p-2" aria-busy="true" aria-label="Loading markets">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-8" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="panel h-[420px] flex items-center justify-center" aria-busy="true" aria-label="Loading chart">
      <div className="skeleton h-3/4 w-11/12" />
    </div>
  );
}

export function PanelSkeleton({ height = "h-40" }: { height?: string }) {
  return <div className={`skeleton ${height}`} aria-busy="true" />;
}
