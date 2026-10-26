/** Shared types for the client. */

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

export type TravelMode = '4W' | '2W' | 'train' | 'walking';

export interface Trip {
  id: string;
  from: string;
  to: string;
  /** Formatted for display, e.g. "12 Mar 2026". */
  date: string;
  /** Route estimate from the directions API when the trip was ended. */
  duration?: string;
  vehicleNumber?: string;
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

export interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  /** The stay this route starts from, when the route was saved from the planner. */
  stay?: string;
}

export interface WaypointStop {
  name: string;
  lat: number;
  lng: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** A row in an autosuggest list. */
export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  /** What gets written into the input when the row is chosen. */
  label: string;
}

/** A place returned by nearby search. Rating is only set when Mappls returns one. */
export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
}

export type ModalType = 'travelMode' | 'vehicleSelection' | null;
export type Theme = 'light' | 'dark';
