/**
 * TripSync — Shared Type Definitions
 * Central type hub for the entire frontend application.
 */

// ─── Vehicle & User ───

export interface Vehicle {
  id: string;
  regNumber: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  twoWheelers: Vehicle[];
  fourWheelers: Vehicle[];
  token?: string;
}

export interface ProfileSetupData {
  name: string;
  numTwoWheelers: number;
  numFourWheelers: number;
}

export interface VehicleRegistrationData {
  twoWheelers: string[];
  fourWheelers: string[];
}

// ─── Trips ───

export type TravelMode = '4W' | '2W' | 'train' | 'walking';

export interface Trip {
  id: string;
  tripName: string;
  date: string;
  duration: string;
  from: string;
  fromSubtitle?: string;
  startTime?: string;
  distance?: number;
  to: string;
  toSubtitle?: string;
  endTime?: string;
  vehicleNumber: string;
  travelers: number;
  stops: number;
  mode: TravelMode;
}

export interface TripDetails {
  from: string;
  to: string;
  mode: TravelMode;
  travelers: number;
  vehicleNumber?: string;
}

// ─── Navigation ───

export interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  stay: string;
  travelTime: string;
}

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface WaypointStop {
  location: { lat: number; lng: number } | string;
  name: string;
  stopover: boolean;
}

// ─── Planner ───

export interface Stay {
  id: string;
  name: string;
  distance?: string;
  rating?: number;
  image?: string;
}

export interface Attraction {
  id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

// ─── UI State ───

export type Theme = 'light' | 'dark';

export type ModalType = 'travelMode' | 'vehicleSelection' | null;

export type TabId = 'sakha' | 'planner' | 'destinations' | 'history';