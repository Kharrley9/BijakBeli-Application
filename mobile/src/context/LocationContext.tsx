import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { LatLng } from '../types';
import { useAuth } from './AuthContext';
import { locationService, pointToLatLng } from '../services/locationService';

export type OriginMode = 'gps' | 'business';

interface LocationContextData {
  originMode: OriginMode;
  setOriginMode: (m: OriginMode) => void;
  /** Resolved origin for the current mode, or null if unavailable. */
  origin: LatLng | null;
  /** Business location from the user profile, or null. */
  businessOrigin: LatLng | null;
  gpsOrigin: LatLng | null;
  gpsLoading: boolean;
  gpsError: string | null;
  /** Ask the device for a fresh GPS fix. Safe to call repeatedly. */
  refreshGps: () => Promise<LatLng | null>;
  /** As query params for the API, or {} when there is no origin. */
  originParams: () => { lat?: number; lng?: number };
}

const LocationContext = createContext<LocationContextData>(
  {} as LocationContextData
);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [originMode, setOriginMode] = useState<OriginMode>('business');
  const [gpsOrigin, setGpsOrigin] = useState<LatLng | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const businessOrigin = useMemo(
    () => pointToLatLng(user?.businessLocation),
    [user?.businessLocation]
  );

  const refreshGps = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await locationService.getCurrentPosition();
      setGpsOrigin(pos);
      return pos;
    } catch (e: any) {
      setGpsError(e?.message || 'Could not get your location');
      return null;
    } finally {
      setGpsLoading(false);
    }
  }, []);

  // If location permission was already granted, start on live GPS instead of the
  // saved business location (no prompt is shown here).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    locationService.hasPermission().then(async (ok) => {
      if (!ok || cancelled) return;
      const pos = await refreshGps();
      if (pos && !cancelled) setOriginMode('gps');
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?._id, refreshGps]);

  // Resolve the active origin, with a sensible fallback to the other source.
  const origin = useMemo(() => {
    if (originMode === 'gps') return gpsOrigin || businessOrigin;
    return businessOrigin || gpsOrigin;
  }, [originMode, gpsOrigin, businessOrigin]);

  const originParams = useCallback(
    () => (origin ? { lat: origin.lat, lng: origin.lng } : {}),
    [origin]
  );

  return (
    <LocationContext.Provider
      value={{
        originMode,
        setOriginMode,
        origin,
        businessOrigin,
        gpsOrigin,
        gpsLoading,
        gpsError,
        refreshGps,
        originParams,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
};
