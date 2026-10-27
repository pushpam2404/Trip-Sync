/** Placeholder for a row of a list that is still loading. Matches the height of the real row. */
export function ListSkeleton({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <ul className="rows" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="space-y-3 py-5" aria-hidden="true">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-11 w-40" />
        </li>
      ))}
    </ul>
  );
}

export function RowSkeleton({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <ul className="rows" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3.5 py-3" aria-hidden="true">
          <div className="skeleton size-11 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/5" />
            <div className="skeleton h-4 w-4/5" />
          </div>
          <div className="skeleton h-11 w-20" />
        </li>
      ))}
    </ul>
  );
}
