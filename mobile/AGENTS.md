# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Native modules — Expo Go no longer works

This app uses `react-native-maps` and `expo-location`, which are **not** in the Expo
Go sandbox. You must run a custom dev build:

```
npx expo prebuild            # generates android/ + ios/ (first time / after config change)
npx expo run:android         # or: npx expo run:ios
```

`npx expo start` alone (Expo Go) will crash on the map screens.

### Android Google Maps key

`app.json` → `expo.android.config.googleMaps.apiKey` is a placeholder. Put a real
**Maps SDK for Android** key there (Google Cloud Console) or the map renders blank on
Android. iOS uses Apple Maps and needs no key.

## Travel-distance feature

- `src/context/LocationContext.tsx` holds the active origin (device GPS or the trader's
  saved `user.businessLocation`). Wrap consumers with `useLocation()`.
- Comparison API calls pass `lat`/`lng` via `originParams()`; the backend attaches
  `distanceKm` / `durationMin` to each store and returns `nearestStore` next to
  `cheapestStore`. Distances are offline estimates (haversine + avg speed) for now.
