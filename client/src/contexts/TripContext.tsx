/**
 * TripContext — Handles trip records, planning stays/attractions, and saved routes.
 * Synchronizes with backend APIs when authenticated, otherwise falls back to local storage.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Trip, SavedRoute, TripDetails } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface TripContextValue {
  trips: Trip[];
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  addTrip: (tripDetails: TripDetails & { duration: string; distance?: number; stops: number }) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;
  clearTrips: () => Promise<void>;
  saveRoute: (origin: string, destination: string, stay?: string) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  reverseRoute: (id: string) => Promise<void>;
  fetchTripsAndRoutes: () => Promise<void>;
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load from local storage or API on mount / auth state change
  const fetchTripsAndRoutes = useCallback(async () => {
    if (!isAuthenticated) {
      // Load offline/fallback mock data or local storage
      try {
        const localTrips = localStorage.getItem('tripsync-trips');
        const localRoutes = localStorage.getItem('tripsync-savedRoutes');
        setTrips(localTrips ? JSON.parse(localTrips) : []);
        setSavedRoutes(localRoutes ? JSON.parse(localRoutes) : []);
      } catch (err) {
        console.error('Failed to load offline data:', err);
      }
      return;
    }

    setIsLoading(true);
    try {
      const [tripsRes, routesRes] = await Promise.all([
        api.get('/trips'),
        api.get('/saved-routes')
      ]);
      
      // Standardize response schemas to frontend Trip & SavedRoute formats
      const backendTrips = tripsRes.data.map((t: any) => ({
        id: t._id,
        tripName: `${t.origin} to ${t.destination}`,
        date: new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: t.duration || 'N/A',
        from: t.origin,
        to: t.destination,
        vehicleNumber: t.vehicle || 'N/A',
        travelers: t.travelers || 1,
        stops: t.stops?.length || 0,
        mode: t.mode || '4W',
      }));

      const backendRoutes = routesRes.data.map((r: any) => ({
        id: r._id,
        origin: r.origin,
        destination: r.destination,
        stay: r.stay || 'N/A',
        travelTime: r.travelTime || 'N/A',
      }));

      setTrips(backendTrips);
      setSavedRoutes(backendRoutes);

      // Cache locally for offline availability
      localStorage.setItem('tripsync-trips', JSON.stringify(backendTrips));
      localStorage.setItem('tripsync-savedRoutes', JSON.stringify(backendRoutes));
    } catch (err) {
      console.error('Failed to fetch from API, falling back to local storage cache:', err);
      // Fallback
      const localTrips = localStorage.getItem('tripsync-trips');
      const localRoutes = localStorage.getItem('tripsync-savedRoutes');
      setTrips(localTrips ? JSON.parse(localTrips) : []);
      setSavedRoutes(localRoutes ? JSON.parse(localRoutes) : []);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTripsAndRoutes();
  }, [fetchTripsAndRoutes]);

  const addTrip = useCallback(async (details: TripDetails & { duration: string; distance?: number; stops: number }) => {
    const newTrip: Trip = {
      id: String(Date.now()),
      tripName: `${details.from} to ${details.to}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: details.duration,
      from: details.from,
      to: details.to,
      vehicleNumber: details.vehicleNumber || 'N/A',
      travelers: details.travelers,
      stops: details.stops,
      mode: details.mode,
    };

    // Optimistic local state update
    setTrips(prev => [newTrip, ...prev]);

    if (isAuthenticated) {
      try {
        await api.post('/trips', {
          origin: details.from,
          destination: details.to,
          startDate: new Date(),
          startTime: new Date().toLocaleTimeString(),
          vehicle: details.vehicleNumber,
          travelers: details.travelers,
          stops: [], // can expand to hold lat/lng stops later if needed
          duration: details.duration,
          mode: details.mode,
        });
        // Refetch to sync correctly with server IDs
        fetchTripsAndRoutes();
      } catch (err) {
        console.error('Failed to save trip to database:', err);
      }
    } else {
      // Local Storage persistence
      localStorage.setItem('tripsync-trips', JSON.stringify([newTrip, ...trips]));
    }
  }, [isAuthenticated, trips, fetchTripsAndRoutes]);

  const removeTrip = useCallback(async (id: string) => {
    // Optimistic local state update
    setTrips(prev => prev.filter(t => t.id !== id));

    if (isAuthenticated) {
      try {
        await api.delete(`/trips/${id}`);
      } catch (err) {
        console.error('Failed to delete trip:', err);
        fetchTripsAndRoutes(); // Rollback on failure
      }
    } else {
      const updated = trips.filter(t => t.id !== id);
      localStorage.setItem('tripsync-trips', JSON.stringify(updated));
    }
  }, [isAuthenticated, trips, fetchTripsAndRoutes]);

  const clearTrips = useCallback(async () => {
    setTrips([]);
    if (isAuthenticated) {
      try {
        // Delete all user trips endpoint or loop deletes
        // To be safe, we delete each trip or call a bulk endpoint. Since there's no bulk endpoint in the prototype,
        // we can loop delete or implement it. Let's delete locally and call delete APIs in parallel
        await Promise.all(trips.map(t => api.delete(`/trips/${t.id}`)));
      } catch (err) {
        console.error('Failed to clear all trips on server:', err);
        fetchTripsAndRoutes();
      }
    } else {
      localStorage.removeItem('tripsync-trips');
    }
  }, [isAuthenticated, trips, fetchTripsAndRoutes]);

  const saveRoute = useCallback(async (origin: string, destination: string, stay = 'N/A') => {
    const newRoute: SavedRoute = {
      id: String(Date.now()),
      origin,
      destination,
      stay,
      travelTime: 'Calculated in Sakha',
    };

    setSavedRoutes(prev => [newRoute, ...prev]);

    if (isAuthenticated) {
      try {
        await api.post('/saved-routes', { origin, destination, stay });
        fetchTripsAndRoutes();
      } catch (err) {
        console.error('Failed to save route to database:', err);
        fetchTripsAndRoutes();
      }
    } else {
      localStorage.setItem('tripsync-savedRoutes', JSON.stringify([newRoute, ...savedRoutes]));
    }
  }, [isAuthenticated, savedRoutes, fetchTripsAndRoutes]);

  const removeRoute = useCallback(async (id: string) => {
    setSavedRoutes(prev => prev.filter(r => r.id !== id));

    if (isAuthenticated) {
      try {
        await api.delete(`/saved-routes/${id}`);
      } catch (err) {
        console.error('Failed to delete route:', err);
        fetchTripsAndRoutes();
      }
    } else {
      const updated = savedRoutes.filter(r => r.id !== id);
      localStorage.setItem('tripsync-savedRoutes', JSON.stringify(updated));
    }
  }, [isAuthenticated, savedRoutes, fetchTripsAndRoutes]);

  const reverseRoute = useCallback(async (id: string) => {
    const route = savedRoutes.find(r => r.id === id);
    if (!route) return;

    const reversed: SavedRoute = {
      ...route,
      id: String(Date.now()), // new timestamp ID
      origin: route.destination,
      destination: route.origin,
    };

    setSavedRoutes(prev => [reversed, ...prev.filter(r => r.id !== id)]);

    if (isAuthenticated) {
      try {
        await Promise.all([
          api.delete(`/saved-routes/${id}`),
          api.post('/saved-routes', { origin: reversed.origin, destination: reversed.destination, stay: reversed.stay })
        ]);
        fetchTripsAndRoutes();
      } catch (err) {
        console.error('Failed to reverse route on server:', err);
        fetchTripsAndRoutes();
      }
    } else {
      const updated = [reversed, ...savedRoutes.filter(r => r.id !== id)];
      localStorage.setItem('tripsync-savedRoutes', JSON.stringify(updated));
    }
  }, [isAuthenticated, savedRoutes, fetchTripsAndRoutes]);

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
    fetchTripsAndRoutes,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
}
