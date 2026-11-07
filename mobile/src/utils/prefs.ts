import AsyncStorage from '@react-native-async-storage/async-storage';

export type DistanceUnit = 'km' | 'mi';
export type Language = 'ms' | 'en';
/** How the buyer travels to the store; drives the fuel-cost estimate. */
export type Vehicle = 'car' | 'motorcycle';

const KEY = 'prefs_v1';

interface Prefs {
  distanceUnit: DistanceUnit;
  language: Language;
  vehicle: Vehicle;
}

const DEFAULTS: Prefs = {
  distanceUnit: 'km',
  language: 'ms',
  vehicle: 'car',
};

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
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function isPrefsLoaded() {
  return loaded;
}
