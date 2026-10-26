import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import { useTrips } from '../contexts/TripContext';
import { useMapplsLoader } from '../hooks/useMapplsLoader';
import { calculateDistance, formatDistance, formatDuration, getDirections, hasRestKey, type Maneuver, type RouteResult } from '../services/mapService';
import type { LatLng, WaypointStop } from '../types';
import { AddStopSheet } from '../components/map/AddStopSheet';
import { Notice } from '../components/ui/Notice';
import { Spinner } from '../components/ui/Spinner';
import { Plate } from '../components/ui/Plate';
import { TurnLeftIcon, TurnRightIcon, StraightIcon, UTurnIcon, MergeIcon, PlusIcon, CloseIcon, LocateIcon } from '../components/ui/icons';

const MANEUVER_ICON: Record<Maneuver, typeof StraightIcon> = {
  left: TurnLeftIcon,
  right: TurnRightIcon,
  straight: StraightIcon,
  uturn: UTurnIcon,
  merge: MergeIcon,
};

const INDIA_CENTRE: LatLng = { lat: 22.9734, lng: 78.6569 };

// Map pins as inline SVG, so they do not depend on any third-party image host.
const pin = (fill: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 1C8 1 2 7 2 15c0 10 14 24 14 24s14-14 14-24C30 7 24 1 16 1z" fill="${fill}" stroke="#14170f" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#fafaf7"/></svg>`,
  )}`;
const dot = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="11" fill="#1d5fd1" stroke="#fff" stroke-width="3"/></svg>',
)}`;

export default function NavigationScreen() {
  const { origin, destination, mode, travelers, vehicleNumber, endNavigation } = useNavigation();
  const { addTrip } = useTrips();
  const { isLoaded, loadError } = useMapplsLoader();

  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const overlays = useRef<any[]>([]);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointStop[]>([]);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [stepIndex, setStepIndex] = useState(1);
  const [followUser, setFollowUser] = useState(true);
  const [addingStop, setAddingStop] = useState(false);

  // Map canvas
  useEffect(() => {
    if (!isLoaded || !mapEl.current || !window.mappls) return;
    const instance = new window.mappls.Map(mapEl.current, { center: INDIA_CENTRE, zoom: 5, zoomControl: false });
    instance.addListener('dragstart', () => setFollowUser(false));
    map.current = instance;
    return () => {
      userMarker.current = null;
      overlays.current = [];
      instance.remove?.();
      map.current = null;
    };
  }, [isLoaded]);

  // Route
  useEffect(() => {
    let cancelled = false;
    setRouteError(null);
    getDirections(origin, destination, waypoints).then((result) => {
      if (cancelled) return;
      if (result) {
        setRoute(result);
        setStepIndex(Math.min(1, Math.max(0, result.steps.length - 1)));
      } else {
        setRouteError(
          hasRestKey()
            ? 'Could not find a route between these places. Check the names and try again.'
            : 'Directions need a Mappls REST key (VITE_MAPPLS_REST_API_KEY), which is not set in this build.',
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [origin, destination, waypoints]);

  // Draw the route and its markers
  useEffect(() => {
    const instance = map.current;
    if (!instance || !route || !window.mappls) return;
    overlays.current.forEach((o) => o.remove?.());
    const next: any[] = [];

    next.push(
      new window.mappls.Polyline({ map: instance, path: route.path, strokeColor: '#1f7a4d', strokeWeight: 6, strokeOpacity: 0.95 }),
    );
    const first = route.path[0];
    const last = route.path[route.path.length - 1];
    next.push(new window.mappls.Marker({ map: instance, position: first, icon_url: pin('#fafaf7') }));
    next.push(new window.mappls.Marker({ map: instance, position: last, icon_url: pin('#f4c20d') }));
    waypoints.forEach((w) => next.push(new window.mappls.Marker({ map: instance, position: { lat: w.lat, lng: w.lng }, icon_url: pin('#8a9181') })));
    overlays.current = next;

    if (!position) {
      instance.setCenter(first);
      instance.setZoom(11);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, waypoints, isLoaded]);

  // Device position
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('This browser cannot share your location, so live guidance is off.');
      return;
    }
    setLocationError(null);
    const id = navigator.geolocation.watchPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => setLocationError(err.code === 1 ? 'Location access is blocked. Allow it in your browser site settings to get live guidance.' : 'Could not read your location.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [retry]);

  // Own-position marker and following
  useEffect(() => {
    const instance = map.current;
    if (!instance || !position || !window.mappls) return;
    if (userMarker.current) userMarker.current.setPosition(position);
    else userMarker.current = new window.mappls.Marker({ map: instance, position, icon_url: dot });
    if (followUser) {
      instance.setCenter(position);
      instance.setZoom(16);
    }
  }, [position, followUser, isLoaded]);

  // Advance to the next instruction once the current turn is reached
  useEffect(() => {
    if (!route || !position) return;
    const step = route.steps[stepIndex];
    if (step && stepIndex < route.steps.length - 1 && calculateDistance(position, step.location) < 40) {
      setStepIndex((i) => i + 1);
    }
  }, [position, route, stepIndex]);

  const recenter = useCallback(() => {
    if (map.current && position) {
      map.current.setCenter(position);
      map.current.setZoom(16);
      setFollowUser(true);
    }
  }, [position]);

  const finish = () => {
    if (route) {
      addTrip({
        from: origin,
        to: destination,
        mode: mode ?? '4W',
        travelers,
        vehicleNumber: vehicleNumber ?? undefined,
        duration: formatDuration(route.duration),
        stops: waypoints,
      });
    }
    endNavigation();
  };

  if (!origin || !destination) return <Navigate to="/" replace />;

  const step = route?.steps[stepIndex];
  const StepIcon = step ? MANEUVER_ICON[step.maneuver] : StraightIcon;
  // Without a GPS fix, measure from where the route starts.
  const toNextTurn = step && route ? formatDistance(calculateDistance(position ?? route.path[0], step.location)) : '';
  const arriveBy = route ? new Date(Date.now() + route.duration * 1000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '--';

  return (
    <div className="flex h-dvh flex-col bg-bg">
      {/* Next instruction */}
      <div className="pt-safe z-10 shrink-0 border-b border-line bg-surface">
        <div className="mx-auto flex min-h-20 w-full max-w-3xl items-center gap-4 px-4 py-3">
          {route && step ? (
            <>
              <span className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-control)] bg-ink text-bg">
                <StepIcon className="size-8" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1" aria-live="polite">
                <p className="font-display text-2xl font-bold leading-tight tnum">{toNextTurn}</p>
                <p className="truncate text-ink-soft">{step.instruction.replace(/<[^>]*>/g, '')}</p>
              </div>
            </>
          ) : routeError ? (
            <p className="text-danger">{routeError}</p>
          ) : (
            <Spinner label="Finding the route" />
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1 bg-raised">
        <div ref={mapEl} className="absolute inset-0" />
        {(loadError || !isLoaded) && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-raised p-6">
            {loadError ? (
              <div className="max-w-sm space-y-2 text-center">
                <p className="t-heading">The map is not available</p>
                <p className="text-ink-soft">{loadError.message} The route details below still work.</p>
              </div>
            ) : (
              <Spinner label="Loading the map" />
            )}
          </div>
        )}
        {locationError && (
          <div className="absolute inset-x-3 top-3 z-20">
            <Notice
              action={
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setRetry((n) => n + 1)}>
                  Try again
                </button>
              }
            >
              {locationError}
            </Notice>
          </div>
        )}
        {!followUser && position && (
          <button type="button" onClick={recenter} className="btn btn-outline absolute bottom-4 right-4 z-10 size-12 bg-surface p-0!" aria-label="Centre the map on my location">
            <LocateIcon className="size-5" />
          </button>
        )}
      </div>

      {/* Trip panel */}
      <div className="pb-safe shrink-0 border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4">
          <dl className="grid grid-cols-3 gap-3">
            {[
              ['Arrive by', arriveBy],
              ['Distance', route ? formatDistance(route.distance) : '--'],
              ['Drive time', route ? formatDuration(route.duration) : '--'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="tnum font-display text-xl font-bold leading-tight sm:text-2xl">{value}</dd>
              </div>
            ))}
          </dl>

          {(vehicleNumber || waypoints.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {vehicleNumber && <Plate reg={vehicleNumber} />}
              {waypoints.map((w, i) => (
                <span key={`${w.name}-${i}`} className="inline-flex max-w-full items-center gap-1 rounded-full border border-line-strong py-1 pl-3 pr-1 text-sm">
                  <span className="truncate">{w.name}</span>
                  <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-raised"
                    onClick={() => setWaypoints((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove stop ${w.name}`}
                  >
                    <CloseIcon className="size-4" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-outline flex-1" onClick={() => setAddingStop(true)}>
              <PlusIcon className="size-4" aria-hidden="true" />
              Add stop
            </button>
            <button type="button" className="btn btn-danger flex-1" onClick={finish}>
              End trip
            </button>
          </div>
        </div>
      </div>

      <AddStopSheet
        open={addingStop}
        onClose={() => setAddingStop(false)}
        around={position ?? route?.path[0] ?? null}
        onAdd={(stop) => setWaypoints((prev) => [...prev, stop])}
      />
    </div>
  );
}
