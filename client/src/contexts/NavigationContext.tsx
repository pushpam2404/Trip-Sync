/**
 * NavigationContext — Manages the state of live active navigation, turn-by-turn routing,
 * selected travel modes, current vehicle, and dynamic stops (waypoints).
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TravelMode, TripDetails, WaypointStop } from '../types';

interface NavigationContextValue {
  navigationOrigin: string | null;
  navigationDestination: string | null;
  setNavigationOrigin: (origin: string | null) => void;
  setNavigationDestination: (dest: string | null) => void;
  selectedMode: TravelMode | null;
  selectedVehicleNumber: string | null;
  travelers: number;
  isNavigating: boolean;
  waypoints: WaypointStop[];
  
  startNavigationFrom: (origin: string, destination: string) => void;
  prepareNavigation: (origin: string, destination: string, mode: TravelMode) => void;
  startNavigation: (details: TripDetails) => void;
  endNavigation: () => void;
  
  addWaypoint: (stop: WaypointStop) => void;
  removeWaypoint: (index: number) => void;
  clearWaypoints: () => void;
  setWaypoints: (stops: WaypointStop[]) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [navigationOrigin, setNavigationOrigin] = useState<string | null>(null);
  const [navigationDestination, setNavigationDestination] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TravelMode | null>(null);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string | null>(null);
  const [travelers, setTravelers] = useState<number>(1);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [waypoints, setWaypointsState] = useState<WaypointStop[]>([]);

  const startNavigationFrom = useCallback((origin: string, destination: string) => {
    setNavigationOrigin(origin);
    setNavigationDestination(destination);
    // Directs user to the setup dialog or screen
    navigate('/navigation');
  }, [navigate]);

  const prepareNavigation = useCallback((origin: string, destination: string, mode: TravelMode) => {
    setNavigationOrigin(origin);
    setNavigationDestination(destination);
    setSelectedMode(mode);
  }, []);

  const startNavigation = useCallback((details: TripDetails) => {
    setNavigationOrigin(details.from);
    setNavigationDestination(details.to);
    setSelectedMode(details.mode);
    setSelectedVehicleNumber(details.vehicleNumber || null);
    setTravelers(details.travelers);
    setIsNavigating(true);
    navigate('/navigation/active');
  }, [navigate]);

  const endNavigation = useCallback(() => {
    setIsNavigating(false);
    setNavigationOrigin(null);
    setNavigationDestination(null);
    setSelectedMode(null);
    setSelectedVehicleNumber(null);
    setTravelers(1);
    setWaypointsState([]);
    navigate('/');
  }, [navigate]);

  const addWaypoint = useCallback((stop: WaypointStop) => {
    setWaypointsState(prev => [...prev, stop]);
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setWaypointsState(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearWaypoints = useCallback(() => {
    setWaypointsState([]);
  }, []);

  const setWaypoints = useCallback((stops: WaypointStop[]) => {
    setWaypointsState(stops);
  }, []);

  const value: NavigationContextValue = {
    navigationOrigin,
    navigationDestination,
    setNavigationOrigin,
    setNavigationDestination,
    selectedMode,
    selectedVehicleNumber,
    travelers,
    isNavigating,
    waypoints,
    startNavigationFrom,
    prepareNavigation,
    startNavigation,
    endNavigation,
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    setWaypoints,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
