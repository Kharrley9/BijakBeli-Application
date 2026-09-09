import * as Location from 'expo-location';
import { LatLng } from '../types';

/**
 * Thin wrapper around expo-location. All methods resolve to plain data or throw
 * a readable Error so screens can show an Alert.
 */
export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentPosition(): Promise<LatLng> {
    const granted = await this.requestPermission();
    if (!granted) {
      throw new Error('Location permission denied');
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  },

  /** Best-effort reverse geocode. Returns '' when unavailable rather than throwing. */
  async reverseGeocode({ lat, lng }: LatLng): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (!results.length) return '';
      const r = results[0];
      return [r.name, r.street, r.district, r.city, r.postalCode, r.region]
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(', ');
    } catch {
      return '';
    }
  },
};

/** GeoJSON [lng,lat] -> {lat,lng}. */
export const pointToLatLng = (
  point?: { coordinates?: number[] } | null
): LatLng | null => {
  const c = point?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const [lng, lat] = c;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};
