/**
 * TripContext: trip history and saved routes. Signed-in users sync with the
 * API and keep a local copy for when the network drops.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Trip, SavedRoute, TripDetails, WaypointStop } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

export type NewTrip = TripDetails & { duration?: string; stops: WaypointStop[] };

interface TripContextValue {
  trips: Trip[];
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  addTrip: (trip: NewTrip) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;
  clearTrips: () => Promise<void>;
  saveRoute: (origin: string, destination: string, stay?: string) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  reverseRoute: (id: string) => Promise<void>;
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

const TRIPS_KEY = 'tripsync-trips';
const ROUTES_KEY = 'tripsync-savedRoutes';

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const readCache = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeCache = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; the in-memory state still works
  }
};

export function TripProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setTrips(readCache(TRIPS_KEY));
      setSavedRoutes(readCache(ROUTES_KEY));
      return;
    }
    setIsLoading(true);
    try {
      const [tripsRes, routesRes] = await Promise.all([api.get('/trips'), api.get('/saved-routes')]);
      const nextTrips: Trip[] = tripsRes.data.map((t: any) => ({
        id: t._id,
        from: t.origin,
        to: t.destination,
        date: formatDate(t.startDate),
        duration: t.duration || undefined,
        vehicleNumber: t.vehicle || undefined,
        travelers: t.travelers || 1,
        stops: t.stops?.length || 0,
        mode: t.mode || '4W',
      }));
      const nextRoutes: SavedRoute[] = routesRes.data.map((r: any) => ({
        id: r._id,
        origin: r.origin,
        destination: r.destination,
        stay: r.stay || undefined,
      }));
      setTrips(nextTrips);
      setSavedRoutes(nextRoutes);
      writeCache(TRIPS_KEY, nextTrips);
      writeCache(ROUTES_KEY, nextRoutes);
    } catch (err) {
      console.error('Could not sync with the API, using the cached copy:', err);
      setTrips(readCache(TRIPS_KEY));
      setSavedRoutes(readCache(ROUTES_KEY));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTrip = useCallback(
    async (details: NewTrip) => {
      const trip: Trip = {
        id: String(Date.now()),
        from: details.from,
        to: details.to,
        date: formatDate(new Date()),
        duration: details.duration,
        vehicleNumber: details.vehicleNumber,
        travelers: details.travelers,
        stops: details.stops.length,
        mode: details.mode,
      };
      setTrips((prev) => {
        const next = [trip, ...prev];
        if (!isAuthenticated) writeCache(TRIPS_KEY, next);
        return next;
      });

      if (!isAuthenticated) return;
      try {
        const now = new Date();
        await api.post('/trips', {
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
        await refresh();
      } catch (err) {
        console.error('Could not save the trip:', err);
      }
    },
    [isAuthenticated, refresh],
  );

  const removeTrip = useCallback(
    async (id: string) => {
      setTrips((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (!isAuthenticated) writeCache(TRIPS_KEY, next);
        return next;
      });
      if (!isAuthenticated) return;
      try {
        await api.delete(`/trips/${id}`);
      } catch (err) {
        console.error('Could not delete the trip:', err);
        refresh();
      }
    },
    [isAuthenticated, refresh],
  );

  const clearTrips = useCallback(async () => {
    setTrips([]);
    if (!isAuthenticated) {
      writeCache(TRIPS_KEY, []);
      return;
    }
    try {
      await api.delete('/trips');
      writeCache(TRIPS_KEY, []);
    } catch (err) {
      console.error('Could not clear trips:', err);
      refresh();
    }
  }, [isAuthenticated, refresh]);

  const saveRoute = useCallback(
    async (origin: string, destination: string, stay?: string) => {
      const route: SavedRoute = { id: String(Date.now()), origin, destination, stay };
      setSavedRoutes((prev) => {
        const next = [route, ...prev];
        if (!isAuthenticated) writeCache(ROUTES_KEY, next);
        return next;
      });
      if (!isAuthenticated) return;
      try {
        await api.post('/saved-routes', { origin, destination, stay });
      } catch (err) {
        console.error('Could not save the route:', err);
      }
      await refresh();
    },
    [isAuthenticated, refresh],
  );

  const removeRoute = useCallback(
    async (id: string) => {
      setSavedRoutes((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (!isAuthenticated) writeCache(ROUTES_KEY, next);
        return next;
      });
      if (!isAuthenticated) return;
      try {
        await api.delete(`/saved-routes/${id}`);
      } catch (err) {
        console.error('Could not delete the route:', err);
        refresh();
      }
    },
    [isAuthenticated, refresh],
  );

  const reverseRoute = useCallback(
    async (id: string) => {
      const route = savedRoutes.find((r) => r.id === id);
      if (!route) return;
      const reversed: SavedRoute = { ...route, id: String(Date.now()), origin: route.destination, destination: route.origin };
      const next = [reversed, ...savedRoutes.filter((r) => r.id !== id)];
      setSavedRoutes(next);
      if (!isAuthenticated) {
        writeCache(ROUTES_KEY, next);
        return;
      }
      try {
        await Promise.all([
          api.delete(`/saved-routes/${id}`),
          api.post('/saved-routes', { origin: reversed.origin, destination: reversed.destination, stay: reversed.stay }),
        ]);
      } catch (err) {
        console.error('Could not reverse the route:', err);
      }
      await refresh();
    },
    [isAuthenticated, savedRoutes, refresh],
  );

  const value: TripContextValue = {
    trips,
    savedRoutes,
    isLoading,
    addTrip,
    removeTrip,
    clearTrips,
    saveRoute,
    removeRoute,
    reverseRoute,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used within a TripProvider');
  return context;
}
