import { Linking } from 'react-native';
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

  /** True if permission is already granted — never shows a prompt. */
  async hasPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentPosition(): Promise<LatLng> {
    const granted = await this.requestPermission();
    if (!granted) {
      throw new Error('Location permission denied');
    }
    // High accuracy uses real GPS (~10-20 m) but can stall indoors, so cap the
    // wait and fall back to a coarser fix rather than leaving the user hanging.
    try {
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('gps-timeout')), 15000)),
      ]);
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      const pos =
        (await Location.getLastKnownPositionAsync()) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
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

/** Open Google Maps (app or browser) with driving directions to a point. No API key needed. */
export const openInGoogleMaps = (dest: LatLng) =>
  Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`
  );
