import type { ReactNode } from 'react';

/** Origin and destination joined by a dotted road. Used wherever a trip is listed. */
export function RouteLine({ from, to, between }: { from: ReactNode; to: ReactNode; between?: ReactNode }) {
  return (
    <div className="route">
      <div className="route-rail" aria-hidden="true">
        <span className="route-from" />
        <span className="route-line" />
        <span className="route-to" />
      </div>
      <div className="route-stops">
        <div className="min-w-0 font-semibold leading-snug break-words">{from}</div>
        {between}
        <div className="min-w-0 font-semibold leading-snug break-words">{to}</div>
      </div>
    </div>
  );
}
