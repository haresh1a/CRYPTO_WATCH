export default function Loading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4" aria-busy="true">
      <div className="panel h-[calc(100vh-7rem)] flex items-center justify-center text-fg-muted text-sm">
        Loading markets…
      </div>
      <div className="space-y-4">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-[420px] w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  );
}
