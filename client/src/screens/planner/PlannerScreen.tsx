import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTrips } from '../../contexts/TripContext';
import { getCurrentAddress, CURRENT_LOCATION } from '../../services/location';
import { hasRestKey, resolvePlace, searchNearbyPlaces } from '../../services/mapService';
import type { NearbyPlace } from '../../types';
import { m } from '../../components/ui/motion';
import { RowSkeleton } from '../../components/ui/Skeleton';
import { PlaceInput } from '../../components/ui/PlaceInput';
import { PageHeader } from '../../components/ui/PageHeader';
import { Notice } from '../../components/ui/Notice';
import { Spinner } from '../../components/ui/Spinner';
import { CheckIcon, PlusIcon, HotelIcon, PinIcon, StarIcon, LocateIcon } from '../../components/ui/icons';

const STEPS = ['Destination', 'Stay', 'Places'];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center" aria-label="Progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`} aria-current={current ? 'step' : undefined}>
            <span className="flex items-center gap-2">
              <span
                className={`grid size-7 place-items-center rounded-full border-2 text-sm font-bold ${
                  done ? 'border-ink bg-ink text-bg' : current ? 'border-ink bg-accent text-on-accent' : 'border-line-strong text-ink-muted'
                }`}
              >
                {done ? <CheckIcon className="size-4" aria-label="done" /> : n}
              </span>
              <span className={`text-sm font-semibold ${current ? 'text-ink' : 'sr-only text-ink-muted sm:not-sr-only'}`}>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="mx-3 h-0 flex-1 border-t-2 border-dotted border-line-strong" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function PlaceRow({
  place,
  icon: Icon,
  action,
}: {
  place: NearbyPlace;
  icon: typeof HotelIcon;
  action: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3.5 py-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] bg-raised text-ink-soft">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-snug">{place.name}</p>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          {place.rating !== undefined && (
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink-soft">
              <StarIcon className="size-3.5" aria-hidden="true" />
              <span className="tnum">{place.rating.toFixed(1)}</span>
            </span>
          )}
          <span className="truncate">{place.address || 'Address not listed'}</span>
        </p>
      </div>
      {action}
    </li>
  );
}

/** Looks up places of one kind around a destination; ignores the result if the inputs changed meanwhile. */
function useNearby(active: boolean, destination: string, keyword: string) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active || !destination || !hasRestKey()) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setPlaces([]);
    (async () => {
      const coords = await resolvePlace(destination);
      const results = await searchNearbyPlaces(keyword, coords ?? undefined, 5000);
      if (cancelled) return;
      setPlaces(results.slice(0, 15));
      setFailed(results.length === 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, destination, keyword, attempt]);

  return { places, loading, failed, retry: () => setAttempt((n) => n + 1) };
}

export default function PlannerScreen() {
  const navigate = useNavigate();
  const { savedRoutes, saveRoute, removeRoute } = useTrips();
  const [params, setParams] = useSearchParams();

  const [destination, setDestination] = useState('');
  // Without a Mappls REST key there is nothing to choose from, so the stay is typed in.
  const [hasBookedStay, setHasBookedStay] = useState(!hasRestKey());
  const [bookedStay, setBookedStay] = useState('');
  const [selectedStay, setSelectedStay] = useState<{ id: string; name: string } | null>(null);
  const [customPlace, setCustomPlace] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stayName = hasBookedStay ? bookedStay.trim() : selectedStay?.name ?? '';

  // The step is in the URL, so Back goes to the previous step. A step whose earlier
  // answers are missing (page opened directly, or reloaded) falls back to the right one.
  const requested = Math.min(Math.max(Number(params.get('step')) || 1, 1), 3);
  const step = !destination.trim() ? 1 : requested === 3 && !stayName ? 2 : requested;
  const setStep = (next: number) => setParams(next === 1 ? {} : { step: String(next) });

  const stays = useNearby(step === 2 && !hasBookedStay, destination, 'hotels and resorts');
  const attractions = useNearby(step === 3, destination, 'tourist attractions');

  const nextFromDestination = async () => {
    setError(null);
    let place = destination.trim();
    if (!place) return;
    if (place === CURRENT_LOCATION) {
      setLocating(true);
      try {
        place = await getCurrentAddress();
        setDestination(place);
      } catch (e) {
        setError((e as Error).message);
        setLocating(false);
        return;
      }
      setLocating(false);
    }
    setStep(2);
  };

  const toggleSaved = (name: string) => {
    const existing = savedRoutes.find((r) => r.origin === stayName && r.destination === name);
    if (existing) removeRoute(existing.id);
    else saveRoute(stayName, name, stayName);
  };

  const addCustomPlace = (event: React.FormEvent) => {
    event.preventDefault();
    const name = customPlace.trim();
    if (!name) return;
    if (!savedRoutes.some((r) => r.origin === stayName && r.destination === name)) saveRoute(stayName, name, stayName);
    setCustomPlace('');
  };

  const reset = () => {
    setDestination('');
    setHasBookedStay(!hasRestKey());
    setBookedStay('');
    setSelectedStay(null);
    navigate('/');
  };

  const savedHere = savedRoutes.filter((r) => r.origin === stayName);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-4 sm:px-8 sm:pt-8">
      <PageHeader title="Trip planner">Pick a destination, a place to stay, and the places worth a detour.</PageHeader>
      {!hasRestKey() && (
        <div className="mb-6">
          <Notice tone="info">
            Place search is off in this build because VITE_MAPPLS_REST_API_KEY is not set. You can still plan: type your destination, your stay and the places you want, and each one is saved as a route.
          </Notice>
        </div>
      )}
      <Stepper step={step} />

      {step === 1 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            nextFromDestination();
          }}
        >
          {error && <Notice>{error}</Notice>}
          <div>
            <PlaceInput label="Where are you going?" value={destination} onChange={setDestination} placeholder="Lonavala, Goa, Manali" suppressFor={CURRENT_LOCATION} />
            <button type="button" className="btn btn-quiet btn-sm mt-1 -ml-2" onClick={() => setDestination(CURRENT_LOCATION)}>
              <LocateIcon className="size-4" aria-hidden="true" />
              Use my location
            </button>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={!destination.trim() || locating}>
            {locating && <span className="spinner" aria-hidden="true" />}
            {locating ? 'Finding your location' : 'Next: choose a stay'}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {hasRestKey() && (
            <div className="flex items-center justify-between gap-4">
              <label id="booked-label" className="font-semibold">I have already booked a stay</label>
              <button
                type="button"
                role="switch"
                aria-checked={hasBookedStay}
                aria-labelledby="booked-label"
                className="switch"
                onClick={() => setHasBookedStay((v) => !v)}
              />
            </div>
          )}

          {hasBookedStay ? (
            <PlaceInput label="Where are you staying?" value={bookedStay} onChange={setBookedStay} placeholder="Hotel or area" queryBias={destination ? ` near ${destination}` : ''} />
          ) : (
            <section aria-labelledby="stays-heading">
              <h2 id="stays-heading" className="t-heading mb-1">Stays near {destination}</h2>
              {stays.loading && <RowSkeleton rows={3} label="Looking for stays" />}
              {!stays.loading && stays.failed && (
                <Notice
                  tone="info"
                  action={<button type="button" className="btn btn-outline btn-sm" onClick={stays.retry}>Try again</button>}
                >
                  No stays found nearby. Try again, or turn on the switch above and type your stay.
                </Notice>
              )}
              <ul className="rows" role="list">
                {stays.places.map((place) => {
                  const picked = selectedStay?.id === place.id;
                  return (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      icon={HotelIcon}
                      action={
                        <button
                          type="button"
                          aria-pressed={picked}
                          className={`btn btn-sm ${picked ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setSelectedStay({ id: place.id, name: place.name })}
                        >
                          {picked ? 'Selected' : 'Select'}
                        </button>
                      }
                    />
                  );
                })}
              </ul>
            </section>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn btn-primary flex-1" disabled={!stayName} onClick={() => setStep(3)}>
              Next: find places
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <section aria-labelledby="places-heading">
            <h2 id="places-heading" className="t-heading">Places near {destination}</h2>
            <p className="mb-1 mt-1 text-ink-soft">
              Add the ones you like. Each becomes a saved route starting from {stayName}.
            </p>
            {attractions.loading && <RowSkeleton rows={3} label="Looking for places" />}
            {!attractions.loading && attractions.failed && (
              <Notice
                tone="info"
                action={<button type="button" className="btn btn-outline btn-sm" onClick={attractions.retry}>Try again</button>}
              >
                No places found for this destination. You can add one by name below.
              </Notice>
            )}
            <ul className="rows" role="list">
              {attractions.places.map((place) => {
                const added = savedRoutes.some((r) => r.origin === stayName && r.destination === place.name);
                return (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    icon={PinIcon}
                    action={
                      <button
                        type="button"
                        className={`icon-btn border-[1.5px] ${added ? 'border-ink bg-ink text-bg hover:bg-ink hover:text-bg' : 'border-line-strong'}`}
                        onClick={() => toggleSaved(place.name)}
                        aria-pressed={added}
                        aria-label={added ? `Remove ${place.name} from saved routes` : `Save route to ${place.name}`}
                      >
                        {/* the tick pops in when a place is saved, confirming the tap */}
                        <m.span key={String(added)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }} className="grid place-items-center">
                          {added ? <CheckIcon className="size-5" /> : <PlusIcon className="size-5" />}
                        </m.span>
                      </button>
                    }
                  />
                );
              })}
            </ul>
          </section>

          <form onSubmit={addCustomPlace} className="space-y-2">
            <label htmlFor="custom-place" className="field-label">Add a place by name</label>
            <div className="flex gap-2">
              <input id="custom-place" className="input flex-1" value={customPlace} onChange={(e) => setCustomPlace(e.target.value)} placeholder="Venna Lake" maxLength={120} />
              <button type="submit" className="btn btn-outline" disabled={!customPlace.trim()}>
                <PlusIcon className="size-4" aria-hidden="true" />
                Add
              </button>
            </div>
            {savedHere.length > 0 && <p className="field-hint">{savedHere.length} saved from this stay so far.</p>}
          </form>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
            <Link to="/saved" className="btn btn-outline">See saved routes</Link>
            <button type="button" className="btn btn-primary flex-1" onClick={reset}>Finish planning</button>
          </div>
        </div>
      )}
    </div>
  );
}
