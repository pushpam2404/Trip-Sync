import axios from "axios";

const getRestKey = (): string => {
  return import.meta.env.VITE_MAPPLS_REST_API_KEY || "";
};

// ─── Mathematical Haversine Distance (No SDK dependency) ───
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
};

// ─── Autosuggest API ───
export const getAutocompletePredictions = async (
  query: string,
): Promise<any[]> => {
  const apiKey = getRestKey();
  if (!apiKey || !query.trim()) return [];

  try {
    const url = `https://atlas.mappls.com/api/places/suggest`;
    const res = await axios.get(url, {
      params: {
        query: query,
        region: "ind",
        access_token: apiKey,
      },
    });

    if (res.data && res.data.suggestedLocations) {
      return res.data.suggestedLocations.map((p: any) => ({
        id: p.eLoc || String(Math.random()),
        place_id: p.eLoc,
        name: p.placeName,
        description: `${p.placeName}, ${p.placeAddress}`,
        vicinity: p.placeAddress,
        structured_formatting: {
          main_text: p.placeName,
          secondary_text: p.placeAddress,
        },
      }));
    }
    return [];
  } catch (err) {
    console.error("Mappls Autosuggest request failed:", err);
    return [];
  }
};

// ─── Text / Nearby Search API ───
export const searchNearbyPlaces = async (
  keyword: string,
  location?: { lat: number; lng: number },
  radius: number = 5000,
): Promise<any[]> => {
  const apiKey = getRestKey();
  if (!apiKey) return [];

  try {
    const url = `https://atlas.mappls.com/api/places/nearby`;
    const params: any = {
      keywords: keyword,
      access_token: apiKey,
    };

    if (location) {
      params.refLocation = `${location.lat},${location.lng}`;
      params.radius = radius;
    }

    const res = await axios.get(url, { params });

    if (res.data && res.data.suggestedLocations) {
      return res.data.suggestedLocations.map((place: any) => ({
        id: place.eLoc,
        place_id: place.eLoc,
        name: place.placeName,
        vicinity: place.placeAddress,
        rating: place.rating || 4.2,
        user_ratings_total: place.user_ratings_total || 25,
        geometry: {
          location: {
            lat: () => place.latitude,
            lng: () => place.longitude,
          },
        },
        photos: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop",
        ],
        icon: place.icon,
      }));
    }
    return [];
  } catch (err) {
    console.error("Mappls Nearby Search request failed:", err);
    return [];
  }
};

// ─── Place Details API (eLoc Lookup) ───
export const getPlaceDetails = async (placeId: string): Promise<any> => {
  const apiKey = getRestKey();
  if (!apiKey) return null;

  try {
    const url = `https://atlas.mappls.com/api/places/detail`;
    const res = await axios.get(url, {
      params: {
        eLoc: placeId,
        access_token: apiKey,
      },
    });

    if (res.data) {
      const detail = res.data;
      return {
        name: detail.placeName,
        geometry: {
          location: {
            lat: () => detail.latitude,
            lng: () => detail.longitude,
          },
        },
        formatted_address: detail.placeAddress,
      };
    }
    return null;
  } catch (err) {
    console.error("Mappls Details lookup failed:", err);
    return null;
  }
};

// ─── Geocoding Helper ───
export const geocodeAddress = async (
  address: string,
): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = getRestKey();
  if (!apiKey) return null;

  try {
    const url = `https://atlas.mappls.com/api/places/geocode`;
    const res = await axios.get(url, {
      params: {
        address: address,
        access_token: apiKey,
      },
    });

    if (res.data && res.data.copResults && res.data.copResults.length > 0) {
      const result = res.data.copResults[0];
      return {
        lat: parseFloat(result.latitude),
        lng: parseFloat(result.longitude),
      };
    }
    return null;
  } catch (err) {
    console.error("Mappls Geocode request failed:", err);
    return null;
  }
};

// ─── Directions API with Adapter ───
export const getDirections = async (
  origin: string | { lat: number; lng: number },
  destination: string | { lat: number; lng: number },
  waypoints: {
    location: string | { lat: number; lng: number };
    stopover: boolean;
  }[] = [],
): Promise<any> => {
  const apiKey = getRestKey();
  if (!apiKey) return null;

  try {
    // Resolve start and end coordinates
    let startCoords = "";
    if (typeof origin === "string") {
      const loc = await geocodeAddress(origin);
      if (!loc) return null;
      startCoords = `${loc.lng},${loc.lat}`;
    } else {
      startCoords = `${origin.lng},${origin.lat}`;
    }

    let endCoords = "";
    if (typeof destination === "string") {
      const loc = await geocodeAddress(destination);
      if (!loc) return null;
      endCoords = `${loc.lng},${loc.lat}`;
    } else {
      endCoords = `${destination.lng},${destination.lat}`;
    }

    // Parse waypoints
    const resolvedWaypoints: string[] = [];
    for (const wp of waypoints) {
      if (typeof wp.location === "string") {
        const loc = await geocodeAddress(wp.location);
        if (loc) resolvedWaypoints.push(`${loc.lng},${loc.lat}`);
      } else {
        resolvedWaypoints.push(`${wp.location.lng},${wp.location.lat}`);
      }
    }

    // Coordinate chain formatting: start;wp1;wp2;...;end
    const coordinateChain = [startCoords, ...resolvedWaypoints, endCoords].join(
      ";",
    );

    // Query Mappls advanced routing API
    const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/route_adv/driving/${coordinateChain}`;
    const res = await axios.get(url, {
      params: {
        overview: "full",
        steps: "true",
      },
    });

    if (res.data && res.data.routes && res.data.routes.length > 0) {
      const route = res.data.routes[0];
      const leg = route.legs[0];

      // Google Maps shape Adapter
      return {
        routes: [
          {
            legs: [
              {
                distance: {
                  text:
                    leg.distance < 1000
                      ? `${Math.round(leg.distance)} m`
                      : `${(leg.distance / 1000).toFixed(1)} km`,
                  value: leg.distance,
                },
                duration: {
                  text:
                    leg.duration < 3600
                      ? `${Math.round(leg.duration / 60)} mins`
                      : `${Math.floor(leg.duration / 3600)}h ${Math.round((leg.duration % 3600) / 60)}m`,
                  value: leg.duration,
                },
                steps: (leg.steps || []).map((step: any) => ({
                  html_instructions:
                    step.maneuver?.instruction ||
                    step.instruction ||
                    "Continue driving",
                  distance: {
                    text:
                      step.distance < 1000
                        ? `${Math.round(step.distance)} m`
                        : `${(step.distance / 1000).toFixed(1)} km`,
                    value: step.distance,
                  },
                  duration: {
                    text: `${Math.round(step.duration / 60)} mins`,
                    value: step.duration,
                  },
                  end_location: {
                    lat: () => step.location?.[1] || 0,
                    lng: () => step.location?.[0] || 0,
                  },
                })),
              },
            ],
            overview_polyline: route.geometry, // Path coordinates (geojson/encoded polyline)
          },
        ],
      };
    }
    return null;
  } catch (err) {
    console.error("Mappls Directions query failed:", err);
    return null;
  }
};

// ─── Reverse Geocoding API ───
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<string> => {
  const apiKey = getRestKey();
  if (!apiKey) return "Unknown Location";

  try {
    const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode`;
    const res = await axios.get(url, {
      params: {
        lat: lat,
        lng: lng,
      },
    });

    if (res.data && res.data.results && res.data.results.length > 0) {
      return res.data.results[0].formatted_address;
    }
    return "Unknown Location";
  } catch (err) {
    console.error("Mappls Reverse Geocoding failed:", err);
    return "Unknown Location";
  }
};
