import React, { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { TripProvider, useTrips } from './TripContext';
import { NavigationProvider, useNavigation } from './NavigationContext';
import { UIProvider, useUI } from './UIContext';

/**
 * AppProvider — A composition wrapper that nests all domain-specific providers.
 * Keeps the bootstrap initialization clean and straightforward in index.tsx.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TripProvider>
        <NavigationProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </NavigationProvider>
      </TripProvider>
    </AuthProvider>
  );
}

/**
 * useAppContext — A unified aggregator hook for backward compatibility.
 * Resolves properties from domain-specific subcontexts to prevent breaking legacy components.
 */
export function useAppContext() {
  const auth = useAuth();
  const trips = useTrips();
  const nav = useNavigation();
  const ui = useUI();

  return {
    // Auth State & Controls
    user: auth.user,
    isLoading: auth.isLoading || trips.isLoading,
    isAuthenticated: auth.isAuthenticated,
    handleLogin: auth.handleLogin,
    handleSignup: auth.handleSignup,
    handleLogout: auth.handleLogout,
    setUser: auth.setUser,
    updateVehicle: auth.updateVehicle,
    profileSetupData: auth.profileSetupData,
    startProfileSetup: auth.startProfileSetup,
    completeProfileSetup: auth.completeProfileSetup,
    skipProfileSetup: auth.skipProfileSetup,

    // Trips & Planner State
    trips: trips.trips,
    savedRoutes: trips.savedRoutes,
    addTrip: trips.addTrip,
    removeTrip: trips.removeTrip,
    clearTrips: trips.clearTrips,
    saveRoute: trips.saveRoute,
    removeRoute: trips.removeRoute,
    reverseRoute: trips.reverseRoute,
    fetchTripsAndRoutes: trips.fetchTripsAndRoutes,

    // Navigation State & Controls
    navigationOrigin: nav.navigationOrigin,
    navigationDestination: nav.navigationDestination,
    setNavigationOrigin: nav.setNavigationOrigin,
    setNavigationDestination: nav.setNavigationDestination,
    selectedMode: nav.selectedMode,
    selectedVehicleNumber: nav.selectedVehicleNumber,
    travelers: nav.travelers,
    isNavigating: nav.isNavigating,
    waypoints: nav.waypoints,
    startNavigationFrom: nav.startNavigationFrom,
    prepareNavigation: nav.prepareNavigation,
    startNavigation: nav.startNavigation,
    endNavigation: nav.endNavigation,
    addWaypoint: nav.addWaypoint,
    removeWaypoint: nav.removeWaypoint,
    clearWaypoints: nav.clearWaypoints,
    setWaypoints: nav.setWaypoints,

    // Global UI State & Controls
    theme: ui.theme,
    setTheme: ui.setTheme,
    activeModal: ui.activeModal,
    setActiveModal: ui.setActiveModal,
    activeTab: ui.activeTab,
    setActiveTab: ui.setActiveTab,
  };
}
