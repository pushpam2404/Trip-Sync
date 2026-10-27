import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTrips } from '../contexts/TripContext';
import { m, AnimatePresence } from '../components/ui/motion';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Notice } from '../components/ui/Notice';
import { useStartTrip } from '../hooks/useStartTrip';
import type { Trip } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { RouteLine } from '../components/ui/RouteLine';
import { Plate } from '../components/ui/Plate';
import { Sheet } from '../components/ui/Sheet';
import { HistoryIcon, TrashIcon, NavigateIcon, PeopleIcon, PinIcon, CarIcon, BikeIcon, TrainIcon, WalkIcon } from '../components/ui/icons';

const MODE_ICON = { '4W': CarIcon, '2W': BikeIcon, train: TrainIcon, walking: WalkIcon } as const;

function TripItem({ trip, onRepeat, onRemove }: { trip: Trip; onRepeat: () => void; onRemove: () => void }) {
  const ModeIcon = MODE_ICON[trip.mode] ?? CarIcon;
  return (
    <m.li exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.18 } }} style={{ overflow: 'hidden' }} className="py-5">
      <p className="t-meta mb-2">
        {trip.date}
        {trip.duration ? `, route estimate ${trip.duration}` : ''}
      </p>
      <RouteLine from={trip.from} to={trip.to} />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
        {trip.vehicleNumber ? <Plate reg={trip.vehicleNumber} /> : <ModeIcon className="size-5" aria-label={trip.mode} />}
        <span className="inline-flex items-center gap-1.5">
          <PeopleIcon className="size-4" aria-hidden="true" />
          {trip.travelers} traveller{trip.travelers === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <PinIcon className="size-4" aria-hidden="true" />
          {trip.stops} stop{trip.stops === 1 ? '' : 's'}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={onRepeat}>
          <NavigateIcon className="size-4" aria-hidden="true" />
          Drive it again
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-danger ml-auto"
          onClick={onRemove}
          aria-label={`Delete trip from ${trip.from} to ${trip.to}`}
        >
          <TrashIcon className="size-5" />
        </button>
      </div>
    </m.li>
  );
}

export default function HistoryScreen() {
  const { trips, removeTrip, clearTrips, isLoading, loadError, reload } = useTrips();
  const startTrip = useStartTrip();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-8 sm:pt-8">
      <PageHeader
        title="Trip history"
        action={
          trips.length > 0 ? (
            <button type="button" className="btn btn-quiet btn-sm text-danger" onClick={() => setConfirmOpen(true)}>
              Clear all
            </button>
          ) : undefined
        }
      >
        {trips.length > 0 ? `${trips.length} trip${trips.length === 1 ? '' : 's'} logged.` : undefined}
      </PageHeader>

      {isLoading && trips.length === 0 ? (
        <ListSkeleton rows={3} label="Loading trip history" />
      ) : loadError ? (
        <Notice action={<button type="button" className="btn btn-outline btn-sm" onClick={reload}>Try again</button>}>{loadError}</Notice>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No trips logged yet"
          action={<Link to="/sakha?tab=route" className="btn btn-primary">Start a trip</Link>}
        >
          When you end a trip on the map screen, it is added here with the route, vehicle and number of travellers.
        </EmptyState>
      ) : (
        <ul className="rows">
          <AnimatePresence initial={false}>
            {trips.map((trip) => (
              <TripItem key={trip.id} trip={trip} onRepeat={() => startTrip(trip.from, trip.to)} onRemove={() => removeTrip(trip.id)} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Clear trip history?">
        <p className="mb-5 text-ink-soft">This deletes all {trips.length} logged trips. It cannot be undone.</p>
        <div className="flex gap-3 pb-1">
          <button type="button" className="btn btn-outline flex-1" onClick={() => setConfirmOpen(false)}>Keep them</button>
          <button
            type="button"
            className="btn btn-danger flex-1"
            onClick={() => {
              clearTrips();
              setConfirmOpen(false);
            }}
          >
            Delete all
          </button>
        </div>
      </Sheet>
    </div>
  );
}
