/**
 * NavigationContext: the trip being set up or driven right now.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TravelMode, TripDetails } from '../types';

interface NavigationContextValue {
  origin: string;
  destination: string;
  setOrigin: (value: string) => void;
  setDestination: (value: string) => void;
  mode: TravelMode | null;
  vehicleNumber: string | null;
  travelers: number;
  /** Locks in the trip details and opens the live navigation screen. */
  startNavigation: (details: TripDetails) => void;
  endNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TravelMode | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string | null>(null);
  const [travelers, setTravelers] = useState(1);

  const startNavigation = useCallback(
    (details: TripDetails) => {
      setOrigin(details.from);
      setDestination(details.to);
      setMode(details.mode);
      setVehicleNumber(details.vehicleNumber || null);
      setTravelers(details.travelers);
      navigate('/navigation');
    },
    [navigate],
  );

  const endNavigation = useCallback(() => {
    setOrigin('');
    setDestination('');
    setMode(null);
    setVehicleNumber(null);
    setTravelers(1);
    navigate('/');
  }, [navigate]);

  const value: NavigationContextValue = {
    origin,
    destination,
    setOrigin,
    setDestination,
    mode,
    vehicleNumber,
    travelers,
    startNavigation,
    endNavigation,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
}
