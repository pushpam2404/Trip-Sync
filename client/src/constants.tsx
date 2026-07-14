// Unified Export Wrapper for constants and icons to maintain backwards compatibility
export * from './components/icons';

// Mock Data preserved for previewing/fallback features
import { SavedRoute, Trip } from './types';

export const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    tripName: 'Trip 1',
    date: 'Jan 20, 2024',
    duration: '1h 15m',
    from: 'Home',
    fromSubtitle: 'Andheri West, Mumbai',
    startTime: '09:30 AM',
    distance: 18.5,
    to: 'Gateway of India',
    toSubtitle: 'Colaba, Mumbai',
    endTime: '10:45 AM',
    vehicleNumber: 'MH 01 AB 1234',
    travelers: 2,
    stops: 1,
    mode: '4W' as const,
  },
  {
    id: '2',
    tripName: 'Trip 2',
    date: 'Jan 18, 2024',
    duration: '45m',
    from: 'Office',
    fromSubtitle: 'Bandra Kurla Complex, Mumbai',
    startTime: '06:15 PM',
    distance: 12.3,
    to: 'Juhu Beach',
    toSubtitle: 'Juhu, Mumbai',
    endTime: '07:00 PM',
    vehicleNumber: 'MH 02 CD 5678',
    travelers: 1,
    stops: 0,
    mode: '2W' as const,
  },
];

export const MOCK_SAVED_ROUTES: SavedRoute[] = [
  {
    id: 'route1',
    origin: 'Taj Mahal Palace',
    destination: 'Gateway of India',
    stay: 'Taj Mahal Palace',
    travelTime: '5 min',
  },
];

export const MOCK_NEARBY_DESTINATIONS = [
    { id: '3', name: 'Gateway of India', distance: '25 km' },
    { id: '4', name: 'Juhu Beach' },
    { id: '5', name: 'Marine Drive', distance: '22 km' },
];

export const MOCK_STAYS = [
    { id: '1', name: 'Taj Mahal Palace', distance: '0.5 km', rating: 4.8, image: 'https://images.unsplash.com/photo-1562369325-1882c5a04a62?q=80&w=600&auto=format&fit=crop' },
    { id: '2', name: 'The Oberoi', distance: '1.2 km', rating: 4.9, image: 'https://images.unsplash.com/photo-1620121823199-9d7a2dec1770?q=80&w=600&auto=format&fit=crop' },
];