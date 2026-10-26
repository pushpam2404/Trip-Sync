import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrips } from '../../contexts/TripContext';
import { getCurrentAddress, CURRENT_LOCATION } from '../../services/location';
import { hasRestKey, resolvePlace, searchNearbyPlaces } from '../../services/mapService';
import type { NearbyPlace } from '../../types';
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

  useEffect(() => {
    if (!active || !destination) return;
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
  }, [active, destination, keyword]);

  return { places, loading, failed };
}

export default function PlannerScreen() {
  const navigate = useNavigate();
  const { savedRoutes, saveRoute, removeRoute } = useTrips();

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [hasBookedStay, setHasBookedStay] = useState(false);
  const [bookedStay, setBookedStay] = useState('');
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stays = useNearby(step === 2 && !hasBookedStay, destination, 'hotels and resorts');
  const attractions = useNearby(step === 3, destination, 'tourist attractions');

  const stayName = useMemo(
    () => (hasBookedStay ? bookedStay.trim() : stays.places.find((s) => s.id === selectedStayId)?.name ?? ''),
    [hasBookedStay, bookedStay, stays.places, selectedStayId],
  );

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

  const toggleSaved = (place: NearbyPlace) => {
    const existing = savedRoutes.find((r) => r.origin === stayName && r.destination === place.name);
    if (existing) removeRoute(existing.id);
    else saveRoute(stayName, place.name, stayName);
  };

  const reset = () => {
    setStep(1);
    setDestination('');
    setHasBookedStay(false);
    setBookedStay('');
    setSelectedStayId(null);
    navigate('/');
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-4 sm:px-8 sm:pt-8">
      <PageHeader title="Trip planner">Pick a destination, a place to stay, and the places worth a detour.</PageHeader>
      {!hasRestKey() && (
        <div className="mb-6">
          <Notice tone="info">Place search needs a Mappls REST key (VITE_MAPPLS_REST_API_KEY), so suggestions and nearby results are empty in this build.</Notice>
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

          {hasBookedStay ? (
            <PlaceInput label="Where are you staying?" value={bookedStay} onChange={setBookedStay} placeholder="Hotel or area" queryBias={destination ? ` near ${destination}` : ''} />
          ) : (
            <section aria-labelledby="stays-heading">
              <h2 id="stays-heading" className="t-heading mb-1">Stays near {destination}</h2>
              {stays.loading && <div className="py-8"><Spinner label="Looking for stays" /></div>}
              {!stays.loading && stays.failed && <Notice tone="info">No stays found nearby. Try another destination, or turn on the switch above and type your stay.</Notice>}
              <ul className="rows" role="list">
                {stays.places.map((place) => {
                  const picked = selectedStayId === place.id;
                  return (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      icon={HotelIcon}
                      action={
                        <button type="button" aria-pressed={picked} className={`btn btn-sm ${picked ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedStayId(place.id)}>
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
            {attractions.loading && <div className="py-8"><Spinner label="Looking for places" /></div>}
            {!attractions.loading && attractions.failed && <Notice tone="info">No places found for this destination.</Notice>}
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
                        onClick={() => toggleSaved(place)}
                        aria-pressed={added}
                        aria-label={added ? `Remove ${place.name} from saved routes` : `Save route to ${place.name}`}
                      >
                        {added ? <CheckIcon className="size-5" /> : <PlusIcon className="size-5" />}
                      </button>
                    }
                  />
                );
              })}
            </ul>
          </section>

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
