import { useEffect, useState } from 'react';
import type { LatLng, NearbyPlace, WaypointStop } from '../../types';
import { calculateDistance, formatDistance, getPlaceDetails, searchNearbyPlaces } from '../../services/mapService';
import { Sheet } from '../ui/Sheet';
import { PlaceInput } from '../ui/PlaceInput';
import { Spinner } from '../ui/Spinner';
import { Notice } from '../ui/Notice';
import { FuelIcon, FoodIcon, AtmIcon, ChargerIcon, ArrowLeftIcon } from '../ui/icons';

const CATEGORIES = [
  { label: 'Petrol', keyword: 'Petrol Pumps', icon: FuelIcon },
  { label: 'Food', keyword: 'Restaurants', icon: FoodIcon },
  { label: 'ATM', keyword: 'ATMs', icon: AtmIcon },
  { label: 'EV charging', keyword: 'EV Charging', icon: ChargerIcon },
];

interface AddStopSheetProps {
  open: boolean;
  onClose: () => void;
  /** Where to search around. Null when the device location is not known yet. */
  around: LatLng | null;
  onAdd: (stop: WaypointStop) => void;
}

export function AddStopSheet({ open, onClose, around, onAdd }: AddStopSheetProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [results, setResults] = useState<(NearbyPlace & { metres: number })[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setCategory(null);
      setResults(null);
      setError(null);
    }
  }, [open]);

  const search = async (label: string, keyword: string) => {
    if (!around) {
      setError('Your location is not available yet, so there is nothing to search around.');
      return;
    }
    setError(null);
    setCategory(label);
    setResults(null);
    const places = await searchNearbyPlaces(keyword, around);
    const sorted = places
      .map((p) => ({ ...p, metres: calculateDistance(around, p) }))
      .sort((a, b) => a.metres - b.metres);
    if (sorted.length === 0) setError(`No ${label.toLowerCase()} places found nearby.`);
    setResults(sorted);
  };

  const addFromSuggestion = async (placeId: string) => {
    const details = await getPlaceDetails(placeId);
    if (!details) {
      setError('Could not load that place. Pick another one.');
      return;
    }
    onAdd({ name: details.name, lat: details.lat, lng: details.lng });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a stop">
      {category === null ? (
        <div className="space-y-5 pb-1">
          {error && <Notice>{error}</Notice>}
          <PlaceInput label="Search for a place" value={query} onChange={setQuery} onSelect={(s) => addFromSuggestion(s.placeId)} placeholder="Name of a town, hotel, dhaba" />
          <div>
            <p className="field-label">Or look nearby</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(({ label, keyword, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className="flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] border-[1.5px] border-line-strong px-4 text-left font-semibold transition-colors hover:bg-raised"
                  onClick={() => search(label, keyword)}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-1">
          <button
            type="button"
            className="btn btn-quiet btn-sm mb-2 -ml-2"
            onClick={() => {
              setCategory(null);
              setResults(null);
              setError(null);
            }}
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            All categories
          </button>
          <h3 className="t-heading mb-1">{category} near you</h3>
          {results === null && <div className="py-8"><Spinner label="Searching" /></div>}
          {error && <Notice tone="info">{error}</Notice>}
          <ul className="rows">
            {results?.map((place) => (
              <li key={place.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{place.name}</p>
                  <p className="truncate text-sm text-ink-muted">
                    <span className="tnum font-semibold text-ink-soft">{formatDistance(place.metres)}</span>
                    {place.address ? `, ${place.address}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    onAdd({ name: place.name, lat: place.lat, lng: place.lng });
                    onClose();
                  }}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
