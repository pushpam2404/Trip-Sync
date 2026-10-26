import { reverseGeocode } from './mapService';

export const CURRENT_LOCATION = 'Current Location';

/** Asks the browser for the user's position and turns it into an address. Throws with a message fit to show. */
export async function getCurrentAddress(): Promise<string> {
  if (!navigator.geolocation) {
    throw new Error('This browser cannot share your location. Type the place instead.');
  }

  let position: GeolocationPosition;
  try {
    position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
    );
  } catch (error) {
    if ((error as GeolocationPositionError)?.code === 1) {
      throw new Error('Location access is blocked. Allow it in your browser site settings, or type the place instead.');
    }
    throw new Error('Could not get your location. Check that location is on for your device, or type the place instead.');
  }

  const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
  if (!address) throw new Error('Could not turn your location into an address. Type the place instead.');
  return address;
}
