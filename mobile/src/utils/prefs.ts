import AsyncStorage from '@react-native-async-storage/async-storage';

export type DistanceUnit = 'km' | 'mi';

const KEY = 'prefs_v1';

interface Prefs {
  distanceUnit: DistanceUnit;
}

const DEFAULTS: Prefs = {
  distanceUnit: 'km',
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
