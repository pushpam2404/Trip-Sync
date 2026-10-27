import type { SavedRoute, Trip, TripDetails, WaypointStop } from '../types';

export type NewTrip = TripDetails & { duration?: string; stops: WaypointStop[] };

export const formatDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** API trip document to the shape the screens use. */
export const fromServerTrip = (t: any): Trip => ({
  id: t._id,
  from: t.origin,
  to: t.destination,
  date: formatDate(t.startDate),
  duration: t.duration || undefined,
  vehicleNumber: t.vehicle || undefined,
  travelers: t.travelers || 1,
  stops: t.stops?.length || 0,
  mode: t.mode || '4W',
});

export const fromServerRoute = (r: any): SavedRoute => ({
  id: r._id,
  origin: r.origin,
  destination: r.destination,
  stay: r.stay || undefined,
});

/** The entry shown in history straight away, before the server has assigned an id. */
export const buildLocalTrip = (details: NewTrip, now: Date = new Date()): Trip => ({
  id: String(now.getTime()),
  from: details.from,
  to: details.to,
  date: formatDate(now),
  duration: details.duration,
  vehicleNumber: details.vehicleNumber,
  travelers: details.travelers,
  stops: details.stops.length,
  mode: details.mode,
});

/** Body for POST /api/trips. */
export const toTripPayload = (details: NewTrip, now: Date = new Date()) => ({
  origin: details.from,
  destination: details.to,
  startDate: now.toISOString(),
  startTime: now.toLocaleTimeString('en-IN'),
  vehicle: details.vehicleNumber,
  travelers: details.travelers,
  stops: details.stops.map((s) => ({ name: s.name, location: { lat: s.lat, lng: s.lng }, stopover: true })),
  duration: details.duration,
  mode: details.mode,
});
