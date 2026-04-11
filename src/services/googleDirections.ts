// Google Directions API Service
import { GOOGLE_CONFIG, NAVIGATION_CONFIG } from '../config';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface DirectionStep {
  instruction: string; // HTML instruction from Google
  plainInstruction: string; // Cleaned text for TTS
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  startLocation: LatLng;
  endLocation: LatLng;
  maneuver?: string; // turn-left, turn-right, etc.
  polyline: string; // encoded polyline for this step
}

export interface DirectionsRoute {
  summary: string;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  startAddress: string;
  endAddress: string;
  steps: DirectionStep[];
  overviewPolyline: string;
  bounds: {
    northeast: LatLng;
    southwest: LatLng;
  };
}

export interface DirectionsResult {
  success: boolean;
  route?: DirectionsRoute;
  error?: string;
}

// Strip HTML tags from Google's instruction text
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

// Convert maneuver to spoken instruction prefix
const getManeuverPrefix = (maneuver?: string): string => {
  if (!maneuver) return '';

  const prefixes: Record<string, string> = {
    'turn-left': 'Turn left',
    'turn-right': 'Turn right',
    'turn-slight-left': 'Turn slightly left',
    'turn-slight-right': 'Turn slightly right',
    'turn-sharp-left': 'Turn sharp left',
    'turn-sharp-right': 'Turn sharp right',
    'uturn-left': 'Make a U-turn on the left',
    'uturn-right': 'Make a U-turn on the right',
    'straight': 'Continue straight',
    'ramp-left': 'Take the ramp on the left',
    'ramp-right': 'Take the ramp on the right',
    'fork-left': 'Keep left at the fork',
    'fork-right': 'Keep right at the fork',
    'ferry': 'Take the ferry',
    'roundabout-left': 'At the roundabout, take the left exit',
    'roundabout-right': 'At the roundabout, take the right exit',
  };

  return prefixes[maneuver] || '';
};

// Get walking directions from Google
export const getDirections = async (
  origin: LatLng,
  destination: LatLng | string,
  mode: 'walking' | 'transit' = NAVIGATION_CONFIG.DEFAULT_TRAVEL_MODE
): Promise<DirectionsResult> => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = typeof destination === 'string'
      ? encodeURIComponent(destination)
      : `${destination.latitude},${destination.longitude}`;

    const url = `${GOOGLE_CONFIG.DIRECTIONS_API}?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${GOOGLE_CONFIG.MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: data.error_message || `Directions API error: ${data.status}`,
      };
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const steps: DirectionStep[] = leg.steps.map((step: any) => ({
      instruction: step.html_instructions,
      plainInstruction: stripHtml(step.html_instructions),
      distance: {
        text: step.distance.text,
        value: step.distance.value,
      },
      duration: {
        text: step.duration.text,
        value: step.duration.value,
      },
      startLocation: {
        latitude: step.start_location.lat,
        longitude: step.start_location.lng,
      },
      endLocation: {
        latitude: step.end_location.lat,
        longitude: step.end_location.lng,
      },
      maneuver: step.maneuver,
      polyline: step.polyline.points,
    }));

    return {
      success: true,
      route: {
        summary: route.summary,
        distance: {
          text: leg.distance.text,
          value: leg.distance.value,
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value,
        },
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        steps,
        overviewPolyline: route.overview_polyline.points,
        bounds: {
          northeast: {
            latitude: route.bounds.northeast.lat,
            longitude: route.bounds.northeast.lng,
          },
          southwest: {
            latitude: route.bounds.southwest.lat,
            longitude: route.bounds.southwest.lng,
          },
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get directions',
    };
  }
};

// Decode Google's encoded polyline to array of coordinates
export const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Format a step for spoken announcement
export const formatStepForSpeech = (
  step: DirectionStep,
  isUpcoming: boolean = false
): string => {
  const prefix = getManeuverPrefix(step.maneuver);
  const distance = step.distance.text;

  if (isUpcoming) {
    // Upcoming turn announcement
    if (prefix) {
      return `In ${distance}, ${prefix.toLowerCase()}.`;
    }
    return `In ${distance}, ${step.plainInstruction}.`;
  }

  // Current instruction
  if (prefix) {
    return `${prefix}. ${step.plainInstruction}. Continue for ${distance}.`;
  }
  return `${step.plainInstruction}. Continue for ${distance}.`;
};
