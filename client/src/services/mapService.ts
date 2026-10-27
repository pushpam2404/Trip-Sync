/**
 * Thin wrappers over the Mappls (MapmyIndia) REST APIs. Every function returns
 * an empty result instead of throwing, so screens can show "nothing found"
 * without a try/catch each. The REST key is read from VITE_MAPPLS_REST_API_KEY.
 */
import axios from 'axios';
import polyline from '@mapbox/polyline';
import type { LatLng, NearbyPlace, PlaceSuggestion } from '../types';

import { config } from '../config';

const restKey = (): string => config.restKey;

export const hasRestKey = (): boolean => restKey().length > 0;

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

export const getAutocompletePredictions = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!hasRestKey() || !query.trim()) return [];
  try {
    const res = await axios.get('https://atlas.mappls.com/api/places/suggest', {
      params: { query, region: 'ind', access_token: restKey() },
    });
    return (res.data?.suggestedLocations ?? []).map((p: any) => ({
      placeId: p.eLoc,
      name: p.placeName,
      address: p.placeAddress ?? '',
      label: p.placeAddress ? `${p.placeName}, ${p.placeAddress}` : p.placeName,
    }));
  } catch (err) {
    console.error('Mappls suggest failed:', err);
    return [];
  }
};

export const searchNearbyPlaces = async (
  keyword: string,
  location?: LatLng,
  radius = 5000,
): Promise<NearbyPlace[]> => {
  if (!hasRestKey()) return [];
  try {
    const params: Record<string, string | number> = { keywords: keyword, access_token: restKey() };
    if (location) {
      params.refLocation = `${location.lat},${location.lng}`;
      params.radius = radius;
    }
    const res = await axios.get('https://atlas.mappls.com/api/places/nearby', { params });
    return (res.data?.suggestedLocations ?? []).map((p: any) => ({
      id: p.eLoc,
      name: p.placeName,
      address: p.placeAddress ?? '',
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : undefined,
    }));
  } catch (err) {
    console.error('Mappls nearby search failed:', err);
    return [];
  }
};

export const getPlaceDetails = async (
  placeId: string,
): Promise<{ name: string; address: string; lat: number; lng: number } | null> => {
  if (!hasRestKey()) return null;
  try {
    const res = await axios.get('https://atlas.mappls.com/api/places/detail', {
      params: { eLoc: placeId, access_token: restKey() },
    });
    const d = res.data;
    if (!d) return null;
    return { name: d.placeName, address: d.placeAddress ?? '', lat: Number(d.latitude), lng: Number(d.longitude) };
  } catch (err) {
    console.error('Mappls place details failed:', err);
    return null;
  }
};

export const geocodeAddress = async (address: string): Promise<LatLng | null> => {
  if (!hasRestKey()) return null;
  try {
    const res = await axios.get('https://atlas.mappls.com/api/places/geocode', {
      params: { address, access_token: restKey() },
    });
    const first = res.data?.copResults?.[0] ?? res.data?.copResults;
    if (!first || first.latitude === undefined) return null;
    return { lat: parseFloat(first.latitude), lng: parseFloat(first.longitude) };
  } catch (err) {
    console.error('Mappls geocode failed:', err);
    return null;
  }
};

/** Coordinates for a typed place name: geocoder first, then the top autosuggest hit. */
export const resolvePlace = async (text: string): Promise<LatLng | null> => {
  if (!text) return null;
  const direct = await geocodeAddress(text);
  if (direct) return direct;
  const [top] = await getAutocompletePredictions(text);
  if (!top) return null;
  const details = await getPlaceDetails(top.placeId);
  return details ? { lat: details.lat, lng: details.lng } : null;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  if (!hasRestKey()) return null;
  try {
    const res = await axios.get(`https://apis.mappls.com/advancedmaps/v1/${restKey()}/rev_geocode`, {
      params: { lat, lng },
    });
    return res.data?.results?.[0]?.formatted_address ?? null;
  } catch (err) {
    console.error('Mappls reverse geocode failed:', err);
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

/** Turns one route from the Mappls route API into a RouteResult. Pure, so it can be tested without the network. */
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
  if (!hasRestKey()) return null;
  try {
    const start = typeof origin === 'string' ? await resolvePlace(origin) : origin;
    const end = typeof destination === 'string' ? await resolvePlace(destination) : destination;
    if (!start || !end) return null;

    const chain = [start, ...waypoints, end].map((p) => `${p.lng},${p.lat}`).join(';');
    const res = await axios.get(
      `https://apis.mappls.com/advancedmaps/v1/${restKey()}/route_adv/driving/${chain}`,
      { params: { overview: 'full', steps: 'true' } },
    );

    return parseRoute(res.data?.routes?.[0], start, end);
  } catch (err) {
    console.error('Mappls directions failed:', err);
    return null;
  }
};
