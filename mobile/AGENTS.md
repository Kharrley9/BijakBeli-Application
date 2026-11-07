# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Native modules — Expo Go no longer works

This app uses `expo-location` and other native modules outside the Expo Go sandbox.
Run a custom dev build:

```
npx expo prebuild            # generates android/ + ios/ (first time / after config change)
npx expo run:android         # or: npx expo run:ios
```

Adding a package with native code means a rebuild; prefer what is already in the build
(e.g. `react-native-svg` for gradients and charts).

## Maps

Maps are OpenStreetMap tiles drawn with Leaflet (`src/components/OsmMap.tsx`,
`src/components/dom/LeafletMap.tsx`), so no Google Maps key is needed.

## Travel-distance feature

- `src/context/LocationContext.tsx` holds the active origin (device GPS or the user's
  saved `user.businessLocation`). Wrap consumers with `useLocation()`.
- Comparison API calls pass `lat`/`lng` (and the vehicle from Settings); the backend
  attaches `distanceKm` / `durationMin` / `travelCost` to each store and returns
  `nearestStore`, `cheapestStore` and `bestValueStore`. Distances are road estimates
  (haversine × 1.3) unless the server has an OpenRouteService key.
