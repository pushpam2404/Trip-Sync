import { describe, expect, it } from 'vitest';
import { buildLocalTrip, fromServerRoute, fromServerTrip, toTripPayload, type NewTrip } from './tripMapping';

const finished: NewTrip = {
  from: 'Pune',
  to: 'Mahabaleshwar',
  mode: '4W',
  travelers: 3,
  vehicleNumber: 'MH 12 AB 1234',
  duration: '2 h 29 min',
  stops: [{ name: 'Wai', lat: 17.95, lng: 73.89 }],
};
const at = new Date('2026-09-14T04:30:00.000Z');

describe('recording a finished trip', () => {
  it('builds the history entry shown before the server answers', () => {
    const trip = buildLocalTrip(finished, at);
    expect(trip).toMatchObject({ from: 'Pune', to: 'Mahabaleshwar', travelers: 3, stops: 1, mode: '4W', duration: '2 h 29 min' });
    expect(trip.id).toBe(String(at.getTime()));
    expect(trip.date).toMatch(/2026/);
  });

  it('builds the request body the API validates', () => {
    const body = toTripPayload(finished, at);
    expect(body.origin).toBe('Pune');
    expect(body.destination).toBe('Mahabaleshwar');
    expect(body.startDate).toBe('2026-09-14T04:30:00.000Z');
    expect(body.stops).toEqual([{ name: 'Wai', location: { lat: 17.95, lng: 73.89 }, stopover: true }]);
    expect(body.mode).toBe('4W');
    expect(body.vehicle).toBe('MH 12 AB 1234');
  });

  it('records a trip with no stops, vehicle or route estimate', () => {
    const body = toTripPayload({ from: 'A', to: 'B', mode: 'walking', travelers: 1, stops: [] }, at);
    expect(body.stops).toEqual([]);
    expect(body.vehicle).toBeUndefined();
    expect(buildLocalTrip({ from: 'A', to: 'B', mode: 'walking', travelers: 1, stops: [] }, at).duration).toBeUndefined();
  });
});

describe('reading API documents', () => {
  it('maps a trip, defaulting missing fields', () => {
    const trip = fromServerTrip({ _id: 't1', origin: 'A', destination: 'B', startDate: '2026-09-14T04:30:00Z' });
    expect(trip).toMatchObject({ id: 't1', from: 'A', to: 'B', travelers: 1, stops: 0, mode: '4W' });
    expect(trip.duration).toBeUndefined();
    expect(trip.vehicleNumber).toBeUndefined();
  });

  it('maps a saved route and treats an empty stay as none', () => {
    expect(fromServerRoute({ _id: 'r1', origin: 'A', destination: 'B', stay: '' }).stay).toBeUndefined();
    expect(fromServerRoute({ _id: 'r1', origin: 'A', destination: 'B', stay: 'Hotel' }).stay).toBe('Hotel');
  });
});
