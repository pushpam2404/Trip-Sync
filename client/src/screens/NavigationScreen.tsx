import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { TripDetails } from '../types';
import { RecenterIcon } from '../constants';
import { InstructionPanel } from '../components/map/InstructionPanel';
import { GeolocationPermissionError } from '../components/common/PermissionErrors';
import { AddStopModal } from '../components/map/AddStopModal';
import { StopsListModal } from '../components/map/StopsListModal';
import { getDirections, calculateDistance, searchNearbyPlaces, reverseGeocode, getPlaceDetails } from '../services/mapService';
import { useMapplsLoader } from '../hooks/useMapplsLoader';

export const NavigationScreen = ({ tripDetails, onCheckOut }: { tripDetails?: TripDetails, onCheckOut?: () => void }) => {
    const navigate = useNavigate();
    const { isLoaded, loadError } = useMapplsLoader();

    const { 
        theme,
        navigationOrigin,
        navigationDestination,
        selectedMode,
        selectedVehicleNumber,
        travelers,
        endNavigation
    } = useAppContext();

    const resolvedTripDetails = tripDetails || {
        from: navigationOrigin || '',
        to: navigationDestination || '',
        mode: selectedMode || '4W',
        travelers: travelers || 1,
        vehicleNumber: selectedVehicleNumber || undefined
    };

    const resolvedOnCheckOut = onCheckOut || endNavigation;

    // Redirect to home if navigation details are missing
    useEffect(() => {
        if (!resolvedTripDetails.from || !resolvedTripDetails.to) {
            navigate('/');
        }
    }, [resolvedTripDetails.from, resolvedTripDetails.to, navigate]);

    const [showAddStopModal, setShowAddStopModal] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const routePolylineRef = useRef<any>(null);
    
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const locationWatcherId = useRef<number | null>(null);

    const [mapError, setMapError] = useState<{ type: 'permission' | 'network' | 'generic'; message: string } | null>(null);
    const [directions, setDirections] = useState<any>(null);
    const [retryTrigger, setRetryTrigger] = useState(0);

    // Navigation State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [distanceToNextTurn, setDistanceToNextTurn] = useState('');
    const [tripMetrics, setTripMetrics] = useState({ eta: '--:--', remainingDist: '--.- km', duration: '-- min' });
    const [isAutoCentering, setIsAutoCentering] = useState(true);
    const [currentTrip, setCurrentTrip] = useState(resolvedTripDetails);

    // Stops / Waypoints
    const [waypoints, setWaypoints] = useState<any[]>([]);
    const [stopSearchResults, setStopSearchResults] = useState<any[] | null>(null);
    const [isStopsListVisible, setIsStopsListVisible] = useState(false);
    const [isCalculatingStops, setIsCalculatingStops] = useState(false);

    // ─── Initialize Mappls Map Canvas ───
    useEffect(() => {
        if (!mapContainerRef.current || !(window as any).mappls) return;

        // Clean up previous map if exists
        if (mapRef.current) {
            mapRef.current.remove();
        }

        // Initialize Map
        const centerCoords = userLocation || { lat: 19.0760, lng: 72.8777 }; // Default to Mumbai
        const map = new (window as any).mappls.Map(mapContainerRef.current, {
            center: { lat: centerCoords.lat, lng: centerCoords.lng },
            zoom: 15,
            zoomControl: false,
            hybrid: false
        });

        mapRef.current = map;

        // Bind drag listeners to toggle autocentering off
        map.addListener('dragstart', () => {
            setIsAutoCentering(false);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Recenter Map Function
    const recenterMap = useCallback(() => {
        if (mapRef.current && userLocation) {
            mapRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
            mapRef.current.setZoom(17);
            setIsAutoCentering(true);
        }
    }, [userLocation]);

    // ─── Render Waypoints / Polylines on Coordinate Updates ───
    useEffect(() => {
        if (!mapRef.current || !directions) return;

        // Clear previous polylines
        if (routePolylineRef.current) {
            routePolylineRef.current.remove();
            routePolylineRef.current = null;
        }

        const route = directions.routes[0];
        const leg = route.legs[0];
        
        // Map Google-adapted coordinates back to Mappls paths
        const paths = leg.steps.map((step: any) => ({ lat: step.end_location.lat(), lng: step.end_location.lng() }));
        
        // Draw Route Polyline
        routePolylineRef.current = new (window as any).mappls.Polyline({
            map: mapRef.current,
            path: paths,
            strokeColor: '#06b6d4',
            strokeWeight: 6,
            strokeOpacity: 0.95
        });

        // Add start and end point markers
        if (paths.length > 0) {
            const startMarker = new (window as any).mappls.Marker({
                map: mapRef.current,
                position: paths[0],
                icon_url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            });
            const endMarker = new (window as any).mappls.Marker({
                map: mapRef.current,
                position: paths[paths.length - 1],
                icon_url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
        }
    }, [directions]);

    // ─── Manage User Location Position Marker ───
    useEffect(() => {
        if (!mapRef.current || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition({ lat: userLocation.lat, lng: userLocation.lng });
        } else {
            userMarkerRef.current = new (window as any).mappls.Marker({
                map: mapRef.current,
                position: { lat: userLocation.lat, lng: userLocation.lng },
                icon_url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            });
        }

        if (isAutoCentering) {
            mapRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
        }
    }, [userLocation, isAutoCentering]);

    // Handle adding stops category search
    const handleAddStopCategory = useCallback(async (type: string, keyword: string) => {
        setShowAddStopModal(false);
        if (!userLocation) {
            setMapError({ type: 'generic', message: "Could not get current location." });
            return;
        }

        setIsCalculatingStops(true);
        setIsStopsListVisible(true);
        setStopSearchResults(null);

        const results = await searchNearbyPlaces(keyword, userLocation);

        if (results && results.length > 0) {
            const placesWithDistance = results.map(place => {
                const dist = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    place.geometry.location.lat(), place.geometry.location.lng()
                );

                return {
                    place: {
                        ...place,
                        description: place.name,
                        secondary_text: place.vicinity
                    },
                    distance: { value: dist, text: dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km` },
                    duration: { value: 0, text: 'Unknown' }
                };
            });
            placesWithDistance.sort((a, b) => a.distance.value - b.distance.value);
            setStopSearchResults(placesWithDistance);
        } else {
            setMapError({ type: 'generic', message: `No ${keyword} found nearby.` });
            setTimeout(() => { setIsStopsListVisible(false); setMapError(null); }, 2500);
        }
        setIsCalculatingStops(false);
    }, [userLocation]);

    const handleSelectStop = async (placeResult: any) => {
        const loc = placeResult.place.geometry ? placeResult.place.geometry.location : placeResult.place.description;
        setWaypoints(prev => [...prev, { location: loc, stopover: true }]);
        setIsStopsListVisible(false);
        setStopSearchResults(null);
    };

    const handlePlaceSelect = async (placeId: string) => {
        setShowAddStopModal(false);
        const place = await getPlaceDetails(placeId);
        if (place && place.geometry && place.geometry.location) {
            setWaypoints(prev => [...prev, { location: place.geometry.location, stopover: true }]);
        } else {
            setMapError({ type: 'generic', message: "Could not fetch details for selected stop." });
        }
    };

    const handleRemoveStop = () => setWaypoints([]);

    // Calculate Directions Route
    useEffect(() => {
        if (!currentTrip.from || !currentTrip.to) return;

        const fetchRoute = async () => {
            const result = await getDirections(currentTrip.from, currentTrip.to, waypoints);
            if (result) {
                setDirections(result);
                setMapError(null);

                const route = result.routes[0];
                const leg = route.legs[0];
                setTripMetrics({
                    eta: leg.duration?.text || '--',
                    remainingDist: leg.distance?.text || '--',
                    duration: leg.duration?.text || '--'
                });
            } else {
                setMapError({ type: 'generic', message: "Could not fetch directions." });
            }
        };

        fetchRoute();
    }, [currentTrip.from, currentTrip.to, waypoints]);

    // Watch Geolocation Coordinates
    useEffect(() => {
        if (!navigator.geolocation) {
            setMapError({ type: 'permission', message: "Geolocation is not supported." });
            return;
        }

        locationWatcherId.current = navigator.geolocation.watchPosition(
            async (position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(newPos);

                if (currentTrip.from === 'Current Location') {
                    try {
                        const addr = await reverseGeocode(newPos.lat, newPos.lng);
                        if (addr) setCurrentTrip(prev => ({ ...prev, from: addr }));
                    } catch (e) {
                        // ignore
                    }
                }

                // Simulate Turn-by-Turn Progress
                if (directions && directions.routes[0] && directions.routes[0].legs[0]) {
                    const steps = directions.routes[0].legs[0].steps;
                    const step = steps[currentStepIndex];
                    if (step) {
                        const dist = calculateDistance(newPos.lat, newPos.lng, step.end_location.lat(), step.end_location.lng());
                        setDistanceToNextTurn(dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`);

                        if (dist < 40 && currentStepIndex < steps.length - 1) {
                            setCurrentStepIndex(prev => prev + 1);
                        }
                    }
                }
            },
            (err) => {
                console.error(err);
                if (err.code === 1) setMapError({ type: 'permission', message: "Location permission denied." });
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );

        return () => {
            if (locationWatcherId.current !== null) navigator.geolocation.clearWatch(locationWatcherId.current);
        };
    }, [directions, currentStepIndex, retryTrigger]);

    const handleRetryLocation = () => {
        setMapError(null);
        setRetryTrigger(prev => prev + 1);
    };

    if (!resolvedTripDetails.from || !resolvedTripDetails.to) {
        return null;
    }

    if (loadError) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-text p-6 text-center space-y-4">
                <p className="text-red-400 text-lg font-bold">Map Engine Failed to Load</p>
                <p className="text-slate-400 text-sm max-w-sm">{loadError.message}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary text-xs">Reload App</button>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-text space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                <p className="text-sm text-slate-400 font-medium">Initializing Map Engine...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col relative bg-background text-text">
            {showAddStopModal && <AddStopModal onClose={() => setShowAddStopModal(false)} onCategorySelect={handleAddStopCategory} onPlaceSelect={handlePlaceSelect} />}
            {isStopsListVisible && (
                <StopsListModal
                    title="Nearby Stops"
                    stops={stopSearchResults}
                    onSelect={handleSelectStop}
                    onClose={() => setIsStopsListVisible(false)}
                    isLoading={isCalculatingStops}
                />
            )}

            {mapError && mapError.type === 'permission' && (
                <GeolocationPermissionError
                    message={mapError.message}
                    onRetry={handleRetryLocation}
                    onCancel={resolvedOnCheckOut}
                />
            )}

            <InstructionPanel
                step={directions?.routes[0]?.legs[0]?.steps[currentStepIndex]}
                distanceToNextTurn={distanceToNextTurn}
            />

            <div className="flex-grow bg-slate-900 flex items-center justify-center relative overflow-hidden">
                {/* Mount Native Mappls Map Wrapper Container */}
                <div ref={mapContainerRef} className="w-full h-full absolute inset-0"></div>

                {mapError && mapError.type !== 'permission' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 z-30 animate-fade-in">
                        <div className="text-center space-y-4">
                            <p className="text-red-400 text-lg font-bold">Mappls API Error</p>
                            <p className="text-slate-300 text-sm">{mapError.message}</p>
                            <button onClick={() => setMapError(null)} className="btn btn-secondary text-xs">Dismiss</button>
                        </div>
                    </div>
                )}
                {!isAutoCentering && (
                    <button onClick={recenterMap} className="absolute bottom-5 right-4 z-10 p-3 bg-slate-900 border border-slate-800 rounded-full shadow-lg" aria-label="Recenter map">
                        <RecenterIcon className="w-6 h-6 text-cyan-400" />
                    </button>
                )}
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-5 z-10 border-t border-slate-900">
                <div className="flex justify-around text-center max-w-md mx-auto">
                    <div>
                        <p className="text-2xl font-bold text-cyan-400">{tripMetrics.eta}</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Duration</p>
                    </div>
                    <div className="w-px bg-slate-800 self-stretch"></div>
                    <div>
                        <p className="text-2xl font-bold text-white">{tripMetrics.remainingDist}</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Distance</p>
                    </div>
                    <div className="w-px bg-slate-800 self-stretch"></div>
                    <div>
                        <p className="text-2xl font-bold text-white">{tripMetrics.duration}</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Remaining</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-900/40 backdrop-blur-md flex gap-4 z-10 border-t border-slate-900 safe-bottom">
                {waypoints.length > 0 ? (
                    <button
                        onClick={handleRemoveStop}
                        className="flex-grow btn btn-secondary text-amber-400 border-amber-500/20 bg-amber-500/5">
                        Remove Stops
                    </button>
                ) : (
                    <button
                        onClick={() => setShowAddStopModal(true)}
                        className="flex-grow btn btn-secondary">
                        Add Stop
                    </button>
                )}
                <button onClick={resolvedOnCheckOut} className="flex-grow btn btn-danger">
                    END TRIP
                </button>
            </div>
        </div>
    );
};
