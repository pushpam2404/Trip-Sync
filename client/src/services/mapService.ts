/**
 * Place search, geocoding and driving directions from free OpenStreetMap
 * services, called straight from the browser (all three send CORS headers):
 *
 * - Nominatim (nominatim.openstreetmap.org): geocoding, reverse geocoding and
 *   nearby search. Its usage policy allows at most one request a second and no
 *   type-ahead, so calls go through a one-a-second queue and are only made when
 *   the user picks a category or starts a trip.
 * - Photon (photon.komoot.io) and Open-Meteo geocoding: type-ahead suggestions,
 *   asked together with short timeouts and merged. Photon knows landmarks and
 *   areas but is sometimes slow; Open-Meteo is fast for towns and cities. A
 *   typed name that neither suggests still resolves through Nominatim.
 * - OSRM demo server (router.project-osrm.org): driving routes with steps.
 *
 * The Mappls key only draws the map tiles now. Every function returns an empty
 * result instead of throwing, so screens can show "nothing found" without a
 * try/catch each. Data © OpenStreetMap contributors.
 */
import axios from 'axios';
import polyline from '@mapbox/polyline';
import type { LatLng, NearbyPlace, PlaceSuggestion } from '../types';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const PHOTON = 'https://photon.komoot.io/api/';
const OPEN_METEO = 'https://geocoding-api.open-meteo.com/v1/search';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';
/** West, south, east, north: India, used to keep results in the country. */
const INDIA_BBOX = [68, 6, 98, 37] as const;

// Nominatim allows one request a second: queue calls and space them out.
let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatimCall = 0;
const nominatim = <T>(path: string, params: Record<string, string | number>): Promise<T> => {
  const run = async () => {
    const wait = lastNominatimCall + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastNominatimCall = Date.now();
    // The public server is sometimes slow for a few seconds; one retry covers it.
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await axios.get(`${NOMINATIM}${path}`, { params: { format: 'jsonv2', ...params }, timeout: 15000 });
        return res.data as T;
      } catch (err) {
        if (attempt >= 1) throw err;
        await new Promise((r) => setTimeout(r, 1100));
        lastNominatimCall = Date.now();
      }
    }
  };
  const next = nominatimQueue.then(run, run);
  nominatimQueue = next.catch(() => undefined);
  return next;
};

/** Short address from a Nominatim display name: the parts after the place name, up to four. */
const shortAddress = (displayName = '', name = ''): string =>
  displayName
    .split(', ')
    .filter((part, i) => !(i === 0 && part === name))
    .filter((part) => !/^\d{6}$/.test(part) && part !== 'India')
    .slice(0, 4)
    .join(', ');

/** Places found by nearby search, kept so a picked row needs no second lookup. */
const knownPlaces = new Map<string, { name: string; address: string; lat: number; lng: number }>();

// ─── Distance ───

/** Great-circle distance in metres. */
export const calculateDistance = (a: LatLng, b: LatLng): number => {
  const R = 6371e3;
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const dLambda = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const formatDistance = (metres: number): string =>
  metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)} km`;

export const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

// ─── Search ───

const plain = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const remember = (name: string, address: string, lat: number, lng: number): PlaceSuggestion => {
  const placeId = `${lat},${lng}`;
  knownPlaces.set(placeId, { name, address, lat, lng });
  return { placeId, name, address, label: address ? `${name}, ${address}` : name };
};

/** Photon: good at partial names, landmarks and areas, but the public server is sometimes slow. */
const photonSuggestions = async (query: string): Promise<PlaceSuggestion[]> => {
  const res = await axios.get(PHOTON, { params: { q: query, limit: 6, bbox: INDIA_BBOX.join(','), lang: 'en' }, timeout: 3500 });
  return (res.data?.features ?? []).map((f: any) => {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
    const name = p.name ?? p.city ?? query;
    return remember(name, [p.city !== name ? p.city : null, p.state].filter(Boolean).join(', '), lat, lng);
  });
};

/** Open-Meteo geocoding: fast towns and cities by name prefix, ranked here by population. */
const openMeteoSuggestions = async (query: string): Promise<PlaceSuggestion[]> => {
  const res = await axios.get(OPEN_METEO, { params: { name: query, count: 20, countryCode: 'IN', language: 'en' }, timeout: 4000 });
  const rows: any[] = res.data?.results ?? [];
  rows.sort((x, y) => (y.population ?? 0) - (x.population ?? 0));
  return rows.map((r) => remember(plain(r.name), [r.admin2, r.admin1].filter(Boolean).map(plain).join(', '), r.latitude, r.longitude));
};

export const getAutocompletePredictions = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!query.trim()) return [];
  const [photon, meteo] = await Promise.allSettled([photonSuggestions(query), openMeteoSuggestions(query)]);
  const merged = [photon, meteo].flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const seen = new Set<string>();
  return merged
    .filter((s) => {
      const key = s.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
};

/** What to ask Nominatim for each category the screens use. */
const NEARBY_QUERY: Record<string, { q: string; label: string }> = {
  'hotels and resorts': { q: 'hotel', label: 'Hotel' },
  'petrol pumps': { q: 'fuel', label: 'Petrol pump' },
  restaurants: { q: 'restaurant', label: 'Restaurant' },
  atms: { q: 'atm', label: 'ATM' },
  'ev charging': { q: 'charging station', label: 'EV charging' },
};

const boxAround = (c: LatLng, metres: number) => {
  const dLat = metres / 111_320;
  const dLng = metres / (111_320 * Math.cos((c.lat * Math.PI) / 180));
  return `${c.lng - dLng},${c.lat + dLat},${c.lng + dLng},${c.lat - dLat}`;
};

export const searchNearbyPlaces = async (
  keyword: string,
  location?: LatLng,
  radius = 5000,
  /** Place name to search near when there are no coordinates, such as the trip destination. */
  nearText = '',
): Promise<NearbyPlace[]> => {
  const { q, label } = NEARBY_QUERY[keyword.toLowerCase()] ?? { q: keyword, label: keyword };
  const toPlace = (r: any): NearbyPlace => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    const name = r.name || label;
    const address = shortAddress(r.display_name, r.name);
    const id = `${lat},${lng}`;
    knownPlaces.set(id, { name, address, lat, lng });
    return { id, name, address, lat, lng };
  };
  try {
    if (!location) {
      if (!nearText.trim()) return [];
      const rows = await nominatim<any[]>('/search', { q: `${q} ${nearText}`, countrycodes: 'in', limit: 10 });
      return rows.map(toPlace);
    }
    // Widen the box once if the first one is nearly empty, as small towns often are.
    for (const metres of [radius, radius * 4]) {
      const rows = await nominatim<any[]>('/search', { q, viewbox: boxAround(location, metres), bounded: 1, limit: 12 });
      if (rows.length >= 3 || metres > radius) return rows.map(toPlace);
    }
    return [];
  } catch (err) {
    console.error('Nearby search failed:', err);
    return [];
  }
};

export const getPlaceDetails = async (
  placeId: string,
): Promise<{ name: string; address: string; lat: number; lng: number } | null> => {
  const known = knownPlaces.get(placeId);
  if (known) return known;
  const [lat, lng] = placeId.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = (await reverseGeocode(lat, lng)) ?? 'Dropped pin';
  return { name, address: '', lat, lng };
};

/** Geocoded names, so a place asked for twice (a retry, a remount) costs one request. */
const geocoded = new Map<string, Promise<LatLng | null>>();

export const geocodeAddress = (address: string): Promise<LatLng | null> => {
  const key = address.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  const cached = geocoded.get(key);
  if (cached) return cached;
  const lookup = nominatim<any[]>('/search', { q: address, countrycodes: 'in', limit: 1 })
    .then((rows) => (rows[0] ? { lat: Number(rows[0].lat), lng: Number(rows[0].lon) } : null))
    .catch((err) => {
      console.error('Geocoding failed:', err);
      geocoded.delete(key);
      return null;
    });
  geocoded.set(key, lookup);
  return lookup;
};

/** Coordinates for a typed place name. */
export const resolvePlace = async (text: string): Promise<LatLng | null> => {
  if (!text) return null;
  const known = [...knownPlaces.values()].find((p) => text === p.name || text === `${p.name}, ${p.address}`);
  if (known) return { lat: known.lat, lng: known.lng };
  return geocodeAddress(text);
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const r = await nominatim<any>('/reverse', { lat, lon: lng, zoom: 16 });
    return r?.display_name ? shortAddress(r.display_name) : null;
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    return null;
  }
};

// ─── Directions ───

export type Maneuver = 'left' | 'right' | 'straight' | 'uturn' | 'merge';

export interface RouteStep {
  instruction: string;
  maneuver: Maneuver;
  /** Where this manoeuvre happens. */
  location: LatLng;
  /** Length of the road segment that follows the manoeuvre, in metres. */
  distance: number;
}

export interface RouteResult {
  distance: number; // metres
  duration: number; // seconds
  path: LatLng[];
  steps: RouteStep[];
}

export const toManeuver = (type = '', modifier = ''): Maneuver => {
  const text = `${type} ${modifier}`.toLowerCase();
  if (text.includes('uturn') || text.includes('u-turn')) return 'uturn';
  if (text.includes('merge')) return 'merge';
  if (text.includes('left')) return 'left';
  if (text.includes('right')) return 'right';
  return 'straight';
};

const IN_INDIA = (p: LatLng) => p.lat > 5 && p.lat < 38 && p.lng > 66 && p.lng < 99;

/** Route geometry can be an encoded polyline (precision 5 or 6) or GeoJSON. */
export const decodeGeometry = (geometry: unknown): LatLng[] => {
  if (typeof geometry === 'string') {
    for (const precision of [5, 6]) {
      try {
        const points = polyline.decode(geometry, precision).map(([lat, lng]) => ({ lat, lng }));
        if (points.length > 1 && points.every((p, i) => i % 20 !== 0 || IN_INDIA(p))) return points;
      } catch {
        // try the next precision
      }
    }
  } else if (geometry && typeof geometry === 'object' && Array.isArray((geometry as any).coordinates)) {
    return (geometry as any).coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
  }
  return [];
};

/** Turns one OSRM route into a RouteResult. Pure, so it can be tested without the network. */
export const parseRoute = (route: any, start: LatLng, end: LatLng): RouteResult | null => {
  if (!route) return null;

  const legs: any[] = route.legs ?? [];
  const rawSteps: any[] = legs.flatMap((leg) => leg.steps ?? []);
  const steps: RouteStep[] = rawSteps.map((s) => {
    const m = s.maneuver ?? {};
    const loc: [number, number] | undefined = m.location ?? s.location;
    const name = s.name ? ` onto ${s.name}` : '';
    return {
      instruction: m.instruction ?? s.instruction ?? `${m.modifier ? `Turn ${m.modifier}` : 'Continue'}${name}`,
      maneuver: toManeuver(m.type, m.modifier),
      location: { lat: loc?.[1] ?? 0, lng: loc?.[0] ?? 0 },
      distance: s.distance ?? 0,
    };
  });

  let path = decodeGeometry(route.geometry);
  if (path.length < 2) path = [start, ...steps.map((s) => s.location), end];

  return {
    distance: route.distance ?? legs.reduce((sum, l) => sum + (l.distance ?? 0), 0),
    duration: route.duration ?? legs.reduce((sum, l) => sum + (l.duration ?? 0), 0),
    path,
    steps,
  };
};

export const getDirections = async (
  origin: string | LatLng,
  destination: string | LatLng,
  waypoints: LatLng[] = [],
): Promise<RouteResult | null> => {
  try {
    const start = typeof origin === 'string' ? await resolvePlace(origin) : origin;
    const end = typeof destination === 'string' ? await resolvePlace(destination) : destination;
    if (!start || !end) return null;

    const chain = [start, ...waypoints, end].map((p) => `${p.lng},${p.lat}`).join(';');
    const res = await axios.get(`${OSRM}/${chain}`, {
      params: { overview: 'full', steps: 'true', geometries: 'polyline' },
      timeout: 15000,
    });

    return parseRoute(res.data?.routes?.[0], start, end);
  } catch (err) {
    console.error('Directions failed:', err);
    return null;
  }
};
