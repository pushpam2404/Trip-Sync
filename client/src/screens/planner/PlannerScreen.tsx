import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext";
import { Stay } from "../../types";
import { MicrophoneIcon, CheckIcon, PlusIcon } from "../../constants";
import {
  MicrophonePermissionError,
  GeolocationPermissionError,
} from "../../components/common/PermissionErrors";
import { PredictionsList } from "../../components/map/PredictionsList";
import { TabScreenHeader } from "../../components/common/TabScreenHeader";

import {
  getAutocompletePredictions,
  searchNearbyPlaces,
  reverseGeocode,
  geocodeAddress,
  getPlaceDetails,
} from "../../services/mapService";
import { PlacePrediction } from "../../components/map/PredictionsList";
import { useSpeechToText } from "../../hooks/useSpeechToText";

export const PlannerScreen = () => {
  const { savedRoutes, saveRoute, removeRoute, setActiveTab } = useAppContext();
  const navigate = useNavigate();

  // Planner state
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("");
  const [hasStayPlanned, setHasStayPlanned] = useState(false);
  const [stayLocation, setStayLocation] = useState("");
  const [stays, setStays] = useState<Stay[]>([]);
  const [isLoadingStays, setIsLoadingStays] = useState(false);
  const [staysError, setStaysError] = useState<string | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);

  const [nearbyAttractions, setNearbyAttractions] = useState<Stay[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);
  const [attractionsError, setAttractionsError] = useState<string | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Autocomplete state
  const [destinationPredictions, setDestinationPredictions] = useState<
    PlacePrediction[]
  >([]);
  const [stayPredictions, setStayPredictions] = useState<PlacePrediction[]>([]);
  const [activePlannerInput, setActivePlannerInput] = useState<
    "destination" | "stay" | null
  >(null);

  const destinationSpeech = useSpeechToText((text) => setDestination(text));
  const staySpeech = useSpeechToText((text) => setStayLocation(text));
  const micPermissionError = destinationSpeech.error || staySpeech.error;

  useEffect(() => {
    const fetchPredictions = async () => {
      if (
        activePlannerInput === "destination" &&
        destination &&
        destination.length > 2 &&
        destination !== "Current Location"
      ) {
        const results = await getAutocompletePredictions(destination);
        setDestinationPredictions(results);
      } else {
        setDestinationPredictions([]);
      }
    };
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [destination, activePlannerInput]);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (
        activePlannerInput === "stay" &&
        stayLocation &&
        stayLocation.length > 2
      ) {
        const results = await getAutocompletePredictions(
          stayLocation + (destination ? ` near ${destination}` : ""),
        );
        setStayPredictions(results);
      } else {
        setStayPredictions([]);
      }
    };
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [stayLocation, activePlannerInput, destination]);

  const resolveDestinationCoords = async (dest: string) => {
    if (!dest) return null;
    try {
      const loc = await geocodeAddress(dest);
      if (loc) return loc;

      const predictions = await getAutocompletePredictions(dest);
      if (predictions && predictions.length > 0) {
        const details = await getPlaceDetails(predictions[0].place_id);
        if (details && details.geometry?.location) {
          return {
            lat: details.geometry.location.lat(),
            lng: details.geometry.location.lng(),
          };
        }
      }
    } catch (e) {
      console.error("Failed to resolve coords for", dest);
    }
    return null;
  };

  const STAY_IMAGES = [
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=400&auto=format&fit=crop",
  ];
  const ATTRACTION_IMAGES = [
    "https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533929736472-594e45db7054?q=80&w=400&auto=format&fit=crop",
  ];

  useEffect(() => {
    const fetchStays = async () => {
      if (
        step === 2 &&
        !hasStayPlanned &&
        destination &&
        destination !== "Current Location"
      ) {
        setIsLoadingStays(true);
        setStaysError(null);
        setStays([]);
        setSelectedStayId(null);

        const destCoords = await resolveDestinationCoords(destination);
        const results = await searchNearbyPlaces(
          `hotels and resorts`,
          destCoords || undefined,
          5000,
        );

        if (results && results.length > 0) {
          const formattedStays: Stay[] = results.map((place) => ({
            id: place.id,
            name: place.name,
            distance: place.vicinity || place.formatted_address || "",
            rating: place.rating || 4.0,
            image:
              place.photos?.[0] ||
              STAY_IMAGES[Math.floor(Math.random() * STAY_IMAGES.length)],
          }));
          setStays(formattedStays.slice(0, 15));
        } else {
          setStaysError(
            "Could not find any stays nearby. Try another destination.",
          );
        }
        setIsLoadingStays(false);
      }
    };

    if (step === 2 && !hasStayPlanned && destination) {
      fetchStays();
    } else if (step < 2) {
      setStays([]);
      setStaysError(null);
    }
  }, [step, hasStayPlanned, destination]);

  useEffect(() => {
    const fetchAttractions = async () => {
      if (step === 3 && destination && destination !== "Current Location") {
        setIsLoadingAttractions(true);
        setAttractionsError(null);
        setNearbyAttractions([]);

        const destCoords = await resolveDestinationCoords(destination);
        const results = await searchNearbyPlaces(
          `tourist attractions`,
          destCoords || undefined,
          5000,
        );

        if (results && results.length > 0) {
          const formattedAttractions: Stay[] = results.map((place) => ({
            id: place.id,
            name: place.name,
            distance:
              place.vicinity ||
              place.formatted_address ||
              "Details unavailable",
            rating: place.rating || 4.2,
            image:
              place.photos?.[0] ||
              ATTRACTION_IMAGES[
                Math.floor(Math.random() * ATTRACTION_IMAGES.length)
              ],
          }));
          setNearbyAttractions(formattedAttractions.slice(0, 15));
        } else {
          setAttractionsError(
            "Could not find attractions for this destination.",
          );
        }
        setIsLoadingAttractions(false);
      }
    };

    if (step === 3 && destination) {
      fetchAttractions();
    }
  }, [step, destination]);

  const handleDestinationNext = async () => {
    setLocationError(null);
    if (destination === "Current Location") {
      setIsFetchingLocation(true);
      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser.");
        }
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
            });
          },
        );

        const address = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (address && address !== "Unknown Location") {
          setDestination(address);
          setStep(2);
        } else {
          throw new Error("Could not determine location name.");
        }
      } catch (error: any) {
        console.error("Error getting location:", error);
        let errorMessage = "Could not geolocate. Enter destination manually.";
        if (error?.code === 1)
          errorMessage = "Permission denied. Enable location access.";
        setLocationError(errorMessage);
      } finally {
        setIsFetchingLocation(false);
      }
    } else if (destination) {
      setStep(2);
    }
  };

  const handleDestinationFocus = () => {
    if (destination === "Current Location") {
      setDestination("");
    }
    setActivePlannerInput("destination");
  };

  const handleStayInfoNext = () => {
    if (hasStayPlanned && !stayLocation) return;
    if (!hasStayPlanned && !selectedStayId) return;
    setStep(3);
  };

  const completeAndGoHome = () => {
    setDestination("Current Location");
    setHasStayPlanned(false);
    setStayLocation("");
    setSelectedStayId(null);
    setStep(1);
    navigate("/");
  };

  const stayName = useMemo(
    () =>
      hasStayPlanned
        ? stayLocation
        : stays.find((s) => s.id === selectedStayId)?.name,
    [hasStayPlanned, stayLocation, selectedStayId, stays],
  );

  const handleToggleDestination = (dest: Stay) => {
    if (!stayName) return;

    const existingRoute = savedRoutes.find(
      (r) => r.origin === stayName && r.destination === dest.name,
    );

    if (existingRoute) {
      removeRoute(existingRoute.id);
    } else {
      saveRoute(stayName, dest.name, stayName);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between max-w-[240px] mx-auto mb-6 select-none">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-200 ${step === num ? "bg-cyan-500 border-cyan-500 text-slate-950 shadow-sm font-extrabold" : step > num ? "bg-slate-900 border-cyan-500 text-cyan-400 font-bold" : "bg-slate-900 border-slate-800 text-slate-550"}`}
          >
            {num}
          </div>
          {num < 3 && (
            <div
              className={`h-px w-10 mx-2 transition-all duration-200 ${step > num ? "bg-cyan-500" : "bg-slate-800"}`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );

  if (step === 3) {
    return (
      <>
        <TabScreenHeader title="Trip Planner" />
        <div className="p-6 text-text max-w-sm md:max-w-4xl w-full mx-auto space-y-5 animate-fade-in">
          <StepIndicator />

          <div className="mb-2 text-center">
            <h1 className="text-lg font-bold text-white tracking-tight">
              Suggestions for {destination}
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Select popular attractions near your stay ({stayName}) to save to
              your routes list.
            </p>
          </div>

          {isLoadingAttractions && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
              <p className="text-slate-405 text-xs">
                Finding attractions near stay...
              </p>
            </div>
          )}

          {attractionsError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 text-center">
              {attractionsError}
            </div>
          )}

          {!isLoadingAttractions &&
            !attractionsError &&
            nearbyAttractions.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-10 italic">
                No popular attractions found in this area.
              </p>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[50vh] md:max-h-[65vh] pr-1.5 scrollbar-thin">
            {nearbyAttractions.map((dest) => {
              const isAdded = savedRoutes.some(
                (r) => r.origin === stayName && r.destination === dest.name,
              );
              return (
                <div
                  key={dest.id}
                  className="card bg-slate-900 border border-slate-850 p-3 flex justify-between items-center hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-slate-800 border border-slate-700/50"
                    />
                    <div className="overflow-hidden space-y-0.5">
                      <h3
                        className="font-bold text-white text-xs truncate"
                        title={dest.name}
                      >
                        {dest.name}
                      </h3>
                      <div className="flex items-center space-x-1.5">
                        {dest.rating && dest.rating > 0 ? (
                          <span className="text-[10px] font-bold text-amber-400">
                            {dest.rating.toFixed(1)} ★
                          </span>
                        ) : null}
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wide">
                          Attraction
                        </span>
                      </div>
                      <p
                        className="text-[9px] text-slate-500 truncate"
                        title={dest.distance}
                      >
                        {dest.distance}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleDestination(dest)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${isAdded ? "bg-emerald-600 text-white" : "bg-slate-800 border border-slate-700 text-cyan-400"}`}
                    aria-label={
                      isAdded ? `Remove ${dest.name}` : `Add ${dest.name}`
                    }
                  >
                    {isAdded ? (
                      <CheckIcon className="h-4 w-4 text-white" />
                    ) : (
                      <PlusIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-3">
            <button
              onClick={completeAndGoHome}
              className="btn btn-primary btn-full py-3"
            >
              Complete Planning
            </button>
            <button
              onClick={() => setActiveTab("destinations")}
              className="btn btn-secondary btn-full py-3"
            >
              View Saved Destinations
            </button>
          </div>
        </div>
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <TabScreenHeader title="Trip Planner" />
        <div className="p-6 text-text max-w-sm md:max-w-4xl w-full mx-auto space-y-6 animate-fade-in">
          <StepIndicator />

          <div className="card bg-slate-900 border border-slate-800 p-4 flex justify-between items-center shadow-sm">
            <label
              htmlFor="stay-toggle"
              className="text-xs font-semibold text-slate-300"
            >
              Have you booked a stay?
            </label>
            <button
              onClick={() => setHasStayPlanned(!hasStayPlanned)}
              className={`relative w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${hasStayPlanned ? "bg-cyan-500" : "bg-slate-850 border border-slate-700"}`}
              role="switch"
              aria-checked={hasStayPlanned}
              aria-label="Toggle stay option"
            >
              <span
                className={`w-4 h-4 bg-slate-950 rounded-full shadow transform transition-transform absolute ${hasStayPlanned ? "translate-x-5" : "translate-x-1"}`}
              ></span>
            </button>
          </div>

          {hasStayPlanned ? (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Stay Location Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={stayLocation}
                  onChange={(e) => setStayLocation(e.target.value)}
                  onFocus={() => setActivePlannerInput("stay")}
                  onBlur={() =>
                    setTimeout(() => setActivePlannerInput(null), 250)
                  }
                  placeholder="e.g., Grand Hyatt Resort"
                  className="input pr-10"
                  autoComplete="off"
                />
                <button
                  onClick={staySpeech.startListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all cursor-pointer ${staySpeech.isListening ? "bg-rose-500/10 text-rose-500 animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
                  aria-label="Voice search stay"
                >
                  <MicrophoneIcon className="w-4 h-4" />
                </button>
                {activePlannerInput === "stay" &&
                  stayPredictions.length > 0 && (
                    <PredictionsList
                      predictions={stayPredictions}
                      onSelect={(p) => {
                        setStayLocation(p.description);
                        setActivePlannerInput(null);
                      }}
                    />
                  )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1 text-center">
                <h3 className="text-sm font-bold text-white">
                  Select a stay in {destination}
                </h3>
                <p className="text-xs text-slate-400">
                  Showing top rated lodgings & accommodations nearby
                </p>
              </div>

              {isLoadingStays && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                  <p className="text-slate-405 text-xs">
                    Searching accommodations...
                  </p>
                </div>
              )}

              {staysError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 text-center">
                  {staysError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[50vh] md:max-h-[60vh] pr-1.5 scrollbar-thin">
                {stays.map((stay) => (
                  <div
                    key={stay.id}
                    className="card bg-slate-900 border border-slate-850 p-3 flex justify-between items-center hover:border-slate-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <img
                        src={stay.image}
                        alt={stay.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-slate-800 border border-slate-700/50"
                      />
                      <div className="overflow-hidden space-y-0.5">
                        <h3 className="font-bold text-white text-xs truncate">
                          {stay.name}
                        </h3>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-amber-400">
                            {stay.rating} ★
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                            Hotel
                          </span>
                        </div>
                        <p
                          className="text-[9px] text-slate-500 truncate"
                          title={stay.distance}
                        >
                          {stay.distance}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStayId(stay.id)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${selectedStayId === stay.id ? "bg-emerald-600 text-white" : "bg-slate-800 text-cyan-400 border border-slate-700 hover:border-cyan-500/55"}`}
                    >
                      {selectedStayId === stay.id ? "Selected" : "Select"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleStayInfoNext}
            disabled={
              (hasStayPlanned && !stayLocation) ||
              (!hasStayPlanned && !selectedStayId)
            }
            className="btn btn-primary btn-full mt-4 py-3.5"
          >
            Find Attractions
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TabScreenHeader title="Trip Planner" />
      <div className="p-6 text-text max-w-sm md:max-w-4xl w-full mx-auto space-y-6 animate-fade-in">
        <StepIndicator />

        <div className="space-y-4">
          <div className="space-y-1 text-center">
            <label className="block text-sm font-bold text-white tracking-tight">
              Destination City
            </label>
            <p className="text-xs text-slate-400">
              Tell Sakha where we are going to explore stays and landmarks
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={handleDestinationFocus}
              onBlur={() => {
                if (destination.trim() === "")
                  setDestination("Current Location");
                setTimeout(() => setActivePlannerInput(null), 250);
              }}
              placeholder="e.g., Lonavala or Goa"
              className="input pr-10"
              autoComplete="off"
            />
            <button
              onClick={destinationSpeech.startListening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all cursor-pointer ${destinationSpeech.isListening ? "bg-rose-500/10 text-rose-500 animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              aria-label="Voice search destination"
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
            {activePlannerInput === "destination" &&
              destinationPredictions.length > 0 && (
                <PredictionsList
                  predictions={destinationPredictions}
                  onSelect={(p) => {
                    setDestination(p.description);
                    setActivePlannerInput(null);
                  }}
                />
              )}
          </div>
        </div>

        <button
          onClick={handleDestinationNext}
          disabled={!destination || isFetchingLocation}
          className="btn btn-primary btn-full py-3.5"
        >
          {isFetchingLocation ? "Locating destination..." : "Next Step"}
        </button>

        {locationError && (
          <GeolocationPermissionError
            message={locationError}
            onRetry={handleDestinationNext}
            onCancel={() => {
              setLocationError(null);
              if (destination === "Current Location") setDestination("");
            }}
          />
        )}
        {micPermissionError && (
          <MicrophonePermissionError
            message={micPermissionError}
            onRetry={() => {
              destinationSpeech.setError(null);
              staySpeech.setError(null);
            }}
            onCancel={() => {
              destinationSpeech.setError(null);
              staySpeech.setError(null);
            }}
          />
        )}
      </div>
    </>
  );
};
