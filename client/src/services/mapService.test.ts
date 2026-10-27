import polyline from '@mapbox/polyline';
import { describe, expect, it } from 'vitest';
import { calculateDistance, decodeGeometry, formatDistance, formatDuration, parseRoute, toManeuver } from './mapService';

const pune = { lat: 18.5204, lng: 73.8567 };
const mumbai = { lat: 19.076, lng: 72.8777 };

describe('calculateDistance', () => {
  it('is zero for the same point', () => {
    expect(calculateDistance(pune, pune)).toBe(0);
  });

  it('is about 120 km between Pune and Mumbai as the crow flies', () => {
    const km = calculateDistance(pune, mumbai) / 1000;
    expect(km).toBeGreaterThan(115);
    expect(km).toBeLessThan(125);
  });

  it('is symmetric', () => {
    expect(calculateDistance(pune, mumbai)).toBeCloseTo(calculateDistance(mumbai, pune), 6);
  });
});

describe('formatDistance and formatDuration', () => {
  it('switches from metres to kilometres at 1000 m', () => {
    expect(formatDistance(640)).toBe('640 m');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(121400)).toBe('121 km');
  });

  it('formats minutes, whole hours and hours with minutes', () => {
    expect(formatDuration(20)).toBe('1 min');
    expect(formatDuration(45 * 60)).toBe('45 min');
    expect(formatDuration(2 * 3600)).toBe('2 h');
    expect(formatDuration(8940)).toBe('2 h 29 min');
  });
});

describe('toManeuver', () => {
  it('maps OSRM-style type and modifier to an icon kind', () => {
    expect(toManeuver('turn', 'left')).toBe('left');
    expect(toManeuver('end of road', 'slight right')).toBe('right');
    expect(toManeuver('merge', 'straight')).toBe('merge');
    expect(toManeuver('turn', 'uturn')).toBe('uturn');
    expect(toManeuver('depart', 'straight')).toBe('straight');
    expect(toManeuver()).toBe('straight');
  });
});

describe('decodeGeometry', () => {
  const points: [number, number][] = [
    [18.5204, 73.8567],
    [18.2, 73.85],
    [17.9237, 73.6586],
  ];

  it('decodes a precision 5 polyline', () => {
    const decoded = decodeGeometry(polyline.encode(points, 5));
    expect(decoded).toHaveLength(3);
    expect(decoded[0].lat).toBeCloseTo(18.5204, 4);
  });

  it('detects a precision 6 polyline by checking the points land in India', () => {
    const decoded = decodeGeometry(polyline.encode(points, 6));
    expect(decoded[2].lng).toBeCloseTo(73.6586, 5);
  });

  it('accepts GeoJSON, which stores longitude first', () => {
    const decoded = decodeGeometry({ coordinates: [[73.8567, 18.5204], [73.6586, 17.9237]] });
    expect(decoded[0]).toEqual({ lat: 18.5204, lng: 73.8567 });
  });

  it('returns nothing for unusable input', () => {
    expect(decodeGeometry(undefined)).toEqual([]);
    expect(decodeGeometry('')).toEqual([]);
  });
});

describe('parseRoute', () => {
  const leg = (distance: number, duration: number) => ({
    distance,
    duration,
    steps: [{ distance, maneuver: { type: 'turn', modifier: 'left', location: [73.85, 18.45], instruction: 'Turn left onto NH48' } }],
  });

  it('sums the legs when the route has waypoints and no totals', () => {
    const route = parseRoute({ legs: [leg(40000, 3000), leg(60000, 4000)] }, pune, mumbai);
    expect(route?.distance).toBe(100000);
    expect(route?.duration).toBe(7000);
    expect(route?.steps).toHaveLength(2);
  });

  it('prefers the route totals and decodes its geometry', () => {
    const route = parseRoute({ distance: 121400, duration: 8940, geometry: polyline.encode([[18.5, 73.8], [17.9, 73.6]]), legs: [leg(1, 1)] }, pune, mumbai);
    expect(route?.distance).toBe(121400);
    expect(route?.path).toHaveLength(2);
  });

  it('falls back to the start, the step points and the end when there is no geometry', () => {
    const route = parseRoute({ legs: [leg(5000, 400)] }, pune, mumbai);
    expect(route?.path[0]).toEqual(pune);
    expect(route?.path[route.path.length - 1]).toEqual(mumbai);
    expect(route?.steps[0].location).toEqual({ lat: 18.45, lng: 73.85 });
    expect(route?.steps[0].maneuver).toBe('left');
  });

  it('returns null when there is no route', () => {
    expect(parseRoute(undefined, pune, mumbai)).toBeNull();
  });
});
