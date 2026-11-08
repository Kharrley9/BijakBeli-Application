import AsyncStorage from '@react-native-async-storage/async-storage';

export type DistanceUnit = 'km' | 'mi';
export type Language = 'ms' | 'en';
/** How the buyer travels to the store; drives the fuel-cost estimate. */
export type Vehicle = 'car' | 'motorcycle';

const KEY = 'prefs_v1';

/** Search-radius choices (km): only stores this close to the buyer are shown. */
export const RADIUS_OPTIONS = [5, 10, 20, 30, 50] as const;

interface Prefs {
  distanceUnit: DistanceUnit;
  language: Language;
  vehicle: Vehicle;
  /** Only stores within this many km are listed and compared. */
  radiusKm: number;
}

const DEFAULTS: Prefs = {
  distanceUnit: 'km',
  language: 'ms',
  vehicle: 'car',
  radiusKm: 10,
};

// Listeners for radius changes, so open screens can reload when it changes.
type Listener = () => void;
const listeners = new Set<Listener>();
export function onPrefsChange(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// In-memory cache so synchronous readers (e.g. DistanceBadge's formatter) don't
// need to await AsyncStorage on every render. Loaded once at app start.
let cache: Prefs = { ...DEFAULTS };
let loaded = false;

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cache = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore, use defaults */
  } finally {
    loaded = true;
  }
  return cache;
}

export function getPrefs(): Prefs {
  return cache;
}

export async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  cache = { ...cache, [key]: value };
  listeners.forEach((fn) => fn());
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function isPrefsLoaded() {
  return loaded;
}
