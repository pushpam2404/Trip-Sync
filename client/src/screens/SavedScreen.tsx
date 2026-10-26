import { useTrips } from '../contexts/TripContext';
import { useStartTrip } from '../hooks/useStartTrip';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { RouteLine } from '../components/ui/RouteLine';
import { SavedIcon, SwapIcon, TrashIcon, NavigateIcon, HotelIcon } from '../components/ui/icons';
import { Link } from 'react-router-dom';

export default function SavedScreen() {
  const { savedRoutes, removeRoute, reverseRoute } = useTrips();
  const startTrip = useStartTrip();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-8 sm:pt-8">
      <PageHeader title="Saved routes">One tap to drive any of them.</PageHeader>

      {savedRoutes.length === 0 ? (
        <EmptyState
          icon={SavedIcon}
          title="Nothing saved yet"
          action={<Link to="/planner" className="btn btn-primary">Open the planner</Link>}
        >
          Routes you add in the trip planner end up here, so you can start them without typing the places again.
        </EmptyState>
      ) : (
        <ul className="rows">
          {savedRoutes.map((route) => (
            <li key={route.id} className="py-5">
              <RouteLine
                from={route.origin}
                to={route.destination}
                between={
                  route.stay && route.stay !== route.origin && (
                    <p className="flex items-center gap-1.5 text-sm font-normal text-ink-muted">
                      <HotelIcon className="size-3.5" aria-hidden="true" />
                      Stay: {route.stay}
                    </p>
                  )
                }
              />
              <div className="mt-4 flex items-center gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => startTrip(route.origin, route.destination)}>
                  <NavigateIcon className="size-4" aria-hidden="true" />
                  Navigate
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => reverseRoute(route.id)}>
                  <SwapIcon className="size-4" aria-hidden="true" />
                  Reverse
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger ml-auto"
                  onClick={() => removeRoute(route.id)}
                  aria-label={`Delete route from ${route.origin} to ${route.destination}`}
                >
                  <TrashIcon className="size-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
