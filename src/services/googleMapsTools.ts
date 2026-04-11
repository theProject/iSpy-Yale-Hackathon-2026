// Google Maps Tools Service
// Comprehensive Google Maps integration for the AI agent
import { GOOGLE_CONFIG, NAVIGATION_CONFIG } from '../config';
import type { Destination } from '../types';
import { addMemory } from './memoryService';

// Place types for nearby search
export type PlaceType =
  | 'restaurant'
  | 'cafe'
  | 'pharmacy'
  | 'hospital'
  | 'bank'
  | 'atm'
  | 'bus_station'
  | 'subway_station'
  | 'grocery_or_supermarket'
  | 'convenience_store'
  | 'park'
  | 'restroom'
  | 'police'
  | 'library'
  | 'post_office';

export interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  distance: number; // meters
  bearing: number; // degrees from north
  direction: string; // "ahead", "left", "right", "behind"
  types: string[];
  isOpen?: boolean;
  rating?: number;
  priceLevel?: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  hours?: string[];
  isOpen?: boolean;
  rating?: number;
  reviews?: number;
  priceLevel?: number;
  accessibility?: {
    wheelchairAccessible?: boolean;
    hasElevator?: boolean;
  };
}

export interface GeocodeResult {
  address: string;
  location: { latitude: number; longitude: number };
  placeId?: string;
}

// Search for nearby places
export const searchNearbyPlaces = async (
  location: { latitude: number; longitude: number },
  type: PlaceType,
  radiusMeters = 500,
  userHeading = 0
): Promise<{ success: boolean; places: NearbyPlace[]; error?: string }> => {
  try {
    const url = `${GOOGLE_CONFIG.PLACES_API}/nearbysearch/json?` +
      `location=${location.latitude},${location.longitude}` +
      `&radius=${radiusMeters}` +
      `&type=${type}` +
      `&key=${GOOGLE_CONFIG.MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return { success: false, places: [], error: data.status };
    }

    const places: NearbyPlace[] = (data.results || []).map((place: Record<string, unknown>) => {
      const placeLocation = (place.geometry as Record<string, { lat: number; lng: number }>).location;
      const distance = calculateDistance(
        location.latitude, location.longitude,
        placeLocation.lat, placeLocation.lng
      );
      const bearing = calculateBearing(
        location.latitude, location.longitude,
        placeLocation.lat, placeLocation.lng
      );
      const direction = getDirectionFromBearing(bearing, userHeading);

      return {
        placeId: place.place_id as string,
        name: place.name as string,
        address: place.vicinity as string,
        distance,
        bearing,
        direction,
        types: place.types as string[],
        isOpen: (place.opening_hours as Record<string, boolean>)?.open_now,
        rating: place.rating as number | undefined,
        priceLevel: place.price_level as number | undefined,
      };
    });

    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);

    return { success: true, places };
  } catch (error) {
    console.error('Nearby search error:', error);
    return { success: false, places: [], error: 'Network error' };
  }
};

// Get place details
export const getPlaceDetails = async (
  placeId: string
): Promise<{ success: boolean; details?: PlaceDetails; error?: string }> => {
  try {
    const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,price_level,wheelchair_accessible_entrance';

    const url = `${GOOGLE_CONFIG.PLACES_API}/details/json?` +
      `place_id=${placeId}` +
      `&fields=${fields}` +
      `&key=${GOOGLE_CONFIG.MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return { success: false, error: data.status };
    }

    const result = data.result;

    const details: PlaceDetails = {
      placeId,
      name: result.name,
      address: result.formatted_address,
      phone: result.formatted_phone_number,
      website: result.website,
      hours: result.opening_hours?.weekday_text,
      isOpen: result.opening_hours?.open_now,
      rating: result.rating,
      reviews: result.user_ratings_total,
      priceLevel: result.price_level,
      accessibility: {
        wheelchairAccessible: result.wheelchair_accessible_entrance,
      },
    };

    return { success: true, details };
  } catch (error) {
    console.error('Place details error:', error);
    return { success: false, error: 'Network error' };
  }
};

// Geocode address to coordinates
export const geocodeAddress = async (
  address: string
): Promise<{ success: boolean; result?: GeocodeResult; error?: string }> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}` +
      `&key=${GOOGLE_CONFIG.MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return { success: false, error: data.status };
    }

    const result = data.results[0];

    return {
      success: true,
      result: {
        address: result.formatted_address,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        placeId: result.place_id,
      },
    };
  } catch (error) {
    console.error('Geocode error:', error);
    return { success: false, error: 'Network error' };
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (
  location: { latitude: number; longitude: number }
): Promise<{ success: boolean; address?: string; placeName?: string; error?: string }> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `latlng=${location.latitude},${location.longitude}` +
      `&key=${GOOGLE_CONFIG.MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return { success: false, error: data.status };
    }

    const result = data.results[0];
    const components = result.address_components;

    // Extract meaningful place name
    let placeName = '';
    for (const comp of components) {
      if (comp.types.includes('point_of_interest') ||
          comp.types.includes('establishment')) {
        placeName = comp.long_name;
        break;
      }
      if (comp.types.includes('route')) {
        placeName = comp.long_name;
      }
    }

    return {
      success: true,
      address: result.formatted_address,
      placeName: placeName || undefined,
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return { success: false, error: 'Network error' };
  }
};

// Format place description for speech
export const formatPlaceForSpeech = (
  place: NearbyPlace,
  includeDetails = false
): string => {
  const distanceText = place.distance < 100
    ? `${Math.round(place.distance)} meters`
    : `${(place.distance / 1000).toFixed(1)} kilometers`;

  let speech = `${place.name} is ${distanceText} ${place.direction}`;

  if (includeDetails) {
    if (place.isOpen !== undefined) {
      speech += place.isOpen ? ', currently open' : ', currently closed';
    }
    if (place.rating) {
      speech += `, rated ${place.rating.toFixed(1)} stars`;
    }
  }

  return speech + '.';
};

// Find nearest place of type
export const findNearest = async (
  location: { latitude: number; longitude: number },
  type: PlaceType,
  userHeading = 0
): Promise<{ success: boolean; place?: NearbyPlace; speech: string }> => {
  const result = await searchNearbyPlaces(location, type, 1000, userHeading);

  if (!result.success || result.places.length === 0) {
    return {
      success: false,
      speech: `Sorry, I couldn't find any ${type.replace(/_/g, ' ')} nearby.`,
    };
  }

  const nearest = result.places[0];
  const speech = `The nearest ${type.replace(/_/g, ' ')} is ${nearest.name}, ` +
    `${formatDistanceForSpeech(nearest.distance)} ${nearest.direction}.`;

  // Remember this search
  await addMemory('location_visit', `Searched for ${type} near current location`, {
    importance: 'low',
    tags: ['search', type],
  });

  return { success: true, place: nearest, speech };
};

// Get directions as text for AI context
export const getDirectionsContext = async (
  origin: { latitude: number; longitude: number },
  destination: Destination
): Promise<string> => {
  try {
    const url = `${GOOGLE_CONFIG.DIRECTIONS_API}?` +
      `origin=${origin.latitude},${origin.longitude}` +
      `&destination=place_id:${destination.placeId}` +
      `&mode=${NAVIGATION_CONFIG.DEFAULT_TRAVEL_MODE}` +
      `&key=${GOOGLE_CONFIG.MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return `Could not get directions to ${destination.name}.`;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    let context = `Directions to ${destination.name}:\n`;
    context += `Total distance: ${leg.distance.text}\n`;
    context += `Estimated time: ${leg.duration.text}\n`;
    context += `Steps:\n`;

    leg.steps.forEach((step: { html_instructions: string; distance: { text: string }; duration: { text: string } }, i: number) => {
      const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
      context += `${i + 1}. ${instruction} (${step.distance.text})\n`;
    });

    return context;
  } catch (error) {
    console.error('Directions context error:', error);
    return `Unable to fetch directions to ${destination.name}.`;
  }
};

// Check if user is at a known place
export const checkCurrentPlace = async (
  location: { latitude: number; longitude: number }
): Promise<{ atPlace: boolean; placeName?: string; placeType?: string }> => {
  const geocode = await reverseGeocode(location);

  if (geocode.success && geocode.placeName) {
    return {
      atPlace: true,
      placeName: geocode.placeName,
    };
  }

  return { atPlace: false };
};

// Helper: Calculate distance between coordinates (Haversine)
const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Calculate bearing between coordinates
const calculateBearing = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Helper: Convert bearing to direction relative to user heading
const getDirectionFromBearing = (bearing: number, userHeading: number): string => {
  const relativeBearing = (bearing - userHeading + 360) % 360;

  if (relativeBearing <= 22.5 || relativeBearing > 337.5) return 'ahead';
  if (relativeBearing > 22.5 && relativeBearing <= 67.5) return 'ahead to your right';
  if (relativeBearing > 67.5 && relativeBearing <= 112.5) return 'to your right';
  if (relativeBearing > 112.5 && relativeBearing <= 157.5) return 'behind to your right';
  if (relativeBearing > 157.5 && relativeBearing <= 202.5) return 'behind you';
  if (relativeBearing > 202.5 && relativeBearing <= 247.5) return 'behind to your left';
  if (relativeBearing > 247.5 && relativeBearing <= 292.5) return 'to your left';
  return 'ahead to your left';
};

// Helper: Format distance for speech
const formatDistanceForSpeech = (meters: number): string => {
  if (meters < 100) {
    return `${Math.round(meters)} meters`;
  }
  if (meters < 1000) {
    return `about ${Math.round(meters / 10) * 10} meters`;
  }
  return `about ${(meters / 1000).toFixed(1)} kilometers`;
};

// Tool definitions for AI model context
export const GOOGLE_MAPS_TOOLS = {
  search_nearby: {
    name: 'search_nearby_places',
    description: 'Search for nearby places of a specific type (restaurant, pharmacy, bank, etc.)',
    parameters: {
      type: 'Place type to search for',
      radius: 'Search radius in meters (optional, default 500)',
    },
  },
  get_directions: {
    name: 'get_directions',
    description: 'Get walking directions to a destination',
    parameters: {
      destination: 'Place name or address to navigate to',
    },
  },
  place_details: {
    name: 'get_place_details',
    description: 'Get detailed information about a specific place (hours, phone, accessibility)',
    parameters: {
      place_name: 'Name of the place',
    },
  },
  current_location: {
    name: 'describe_current_location',
    description: 'Describe where the user currently is',
    parameters: {},
  },
  find_nearest: {
    name: 'find_nearest',
    description: 'Find the single nearest place of a specific type',
    parameters: {
      type: 'Type of place to find',
    },
  },
};
