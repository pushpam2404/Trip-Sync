/**
 * TripContext: trip history and saved routes. Signed-in users sync with the API
 * and keep a local copy for when the network drops. Changes show up immediately
 * and are rolled back with a message if the server refuses them.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Trip, SavedRoute } from '../types';
import { fromServerTrip, fromServerRoute, buildLocalTrip, toTripPayload, type NewTrip } from '../services/tripMapping';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';

export type { NewTrip };

interface TripContextValue {
  trips: Trip[];
  savedRoutes: SavedRoute[];
  /** True until the first load finishes. */
  isLoading: boolean;
  /** Set when the first load failed and there was no cached copy to show. */
  loadError: string | null;
  reload: () => Promise<void>;
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
  const notify = useToast();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Latest values for rollbacks, without making every callback depend on the lists.
  const tripsRef = useRef(trips);
  const routesRef = useRef(savedRoutes);
  tripsRef.current = trips;
  routesRef.current = savedRoutes;
  const loaded = useRef(false);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      loaded.current = false;
      setTrips(readCache(TRIPS_KEY));
      setSavedRoutes(readCache(ROUTES_KEY));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const [tripsRes, routesRes] = await Promise.all([api.get('/trips'), api.get('/saved-routes')]);
      setTrips(tripsRes.data.map(fromServerTrip));
      setSavedRoutes(routesRes.data.map(fromServerRoute));
      loaded.current = true;
    } catch (err) {
      console.error('Could not sync with the API:', err);
      const cachedTrips = readCache<Trip>(TRIPS_KEY);
      const cachedRoutes = readCache<SavedRoute>(ROUTES_KEY);
      setTrips(cachedTrips);
      setSavedRoutes(cachedRoutes);
      loaded.current = cachedTrips.length + cachedRoutes.length > 0;
      if (!loaded.current) setLoadError('Could not load your trips. Check your connection and try again.');
      else notify('You are offline, showing the last saved copy.');
    } finally {
      setIsLoading(false);
    }
    // notify is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep the offline copy in step with what is on screen.
  useEffect(() => {
    if (loaded.current) writeCache(TRIPS_KEY, trips);
  }, [trips]);
  useEffect(() => {
    if (loaded.current) writeCache(ROUTES_KEY, savedRoutes);
  }, [savedRoutes]);

  const addTrip = useCallback(
    async (details: NewTrip) => {
      const optimistic = buildLocalTrip(details);
      const previous = tripsRef.current;
      setTrips([optimistic, ...previous]);
      if (!isAuthenticated) return;
      try {
        const { data } = await api.post('/trips', toTripPayload(details));
        setTrips((current) => current.map((t) => (t.id === optimistic.id ? fromServerTrip(data) : t)));
      } catch (err) {
        console.error('Could not save the trip:', err);
        setTrips((current) => current.filter((t) => t.id !== optimistic.id));
        notify('The trip could not be saved to your account, so it is not in your history.', 'error');
      }
    },
    [isAuthenticated, notify],
  );

  const removeTrip = useCallback(
    async (id: string) => {
      const previous = tripsRef.current;
      setTrips(previous.filter((t) => t.id !== id));
      if (!isAuthenticated) return;
      try {
        await api.delete(`/trips/${id}`);
      } catch (err) {
        console.error('Could not delete the trip:', err);
        setTrips(previous);
        notify('Could not delete the trip. It has been put back.', 'error');
      }
    },
    [isAuthenticated, notify],
  );

  const clearTrips = useCallback(async () => {
    const previous = tripsRef.current;
    setTrips([]);
    if (!isAuthenticated) return;
    try {
      await api.delete('/trips');
    } catch (err) {
      console.error('Could not clear trips:', err);
      setTrips(previous);
      notify('Could not clear your history. Your trips are back.', 'error');
    }
  }, [isAuthenticated, notify]);

  const saveRoute = useCallback(
    async (origin: string, destination: string, stay?: string) => {
      const optimistic: SavedRoute = { id: `tmp-${Date.now()}`, origin, destination, stay };
      const previous = routesRef.current;
      setSavedRoutes([optimistic, ...previous]);
      if (!isAuthenticated) return;
      try {
        const { data } = await api.post('/saved-routes', { origin, destination, stay });
        setSavedRoutes((current) => current.map((r) => (r.id === optimistic.id ? fromServerRoute(data) : r)));
      } catch (err) {
        console.error('Could not save the route:', err);
        setSavedRoutes((current) => current.filter((r) => r.id !== optimistic.id));
        notify(`Could not save the route to ${destination}.`, 'error');
      }
    },
    [isAuthenticated, notify],
  );

  const removeRoute = useCallback(
    async (id: string) => {
      const previous = routesRef.current;
      setSavedRoutes(previous.filter((r) => r.id !== id));
      if (!isAuthenticated || id.startsWith('tmp-')) return;
      try {
        await api.delete(`/saved-routes/${id}`);
      } catch (err) {
        console.error('Could not delete the route:', err);
        setSavedRoutes(previous);
        notify('Could not delete the route. It has been put back.', 'error');
      }
    },
    [isAuthenticated, notify],
  );

  const reverseRoute = useCallback(
    async (id: string) => {
      const previous = routesRef.current;
      const route = previous.find((r) => r.id === id);
      if (!route) return;
      const optimistic: SavedRoute = { ...route, id: `tmp-${Date.now()}`, origin: route.destination, destination: route.origin };
      setSavedRoutes([optimistic, ...previous.filter((r) => r.id !== id)]);
      if (!isAuthenticated) return;
      try {
        // Create the reversed copy first, so a failure never loses the original.
        const { data } = await api.post('/saved-routes', { origin: optimistic.origin, destination: optimistic.destination, stay: optimistic.stay });
        await api.delete(`/saved-routes/${id}`);
        setSavedRoutes((current) => current.map((r) => (r.id === optimistic.id ? fromServerRoute(data) : r)));
      } catch (err) {
        console.error('Could not reverse the route:', err);
        setSavedRoutes(previous);
        notify('Could not reverse the route. It is unchanged.', 'error');
        reload();
      }
    },
    [isAuthenticated, notify, reload],
  );

  const value: TripContextValue = {
    trips,
    savedRoutes,
    isLoading,
    loadError,
    reload,
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
