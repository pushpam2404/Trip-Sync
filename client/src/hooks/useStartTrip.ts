import { useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';

/** Sets the route and opens the travel-mode sheet, which leads on to the map. */
export function useStartTrip() {
  const { setOrigin, setDestination } = useNavigation();
  const { setActiveModal } = useUI();
  return useCallback(
    (from: string, to: string) => {
      setOrigin(from);
      setDestination(to);
      setActiveModal('travelMode');
    },
    [setOrigin, setDestination, setActiveModal],
  );
}
