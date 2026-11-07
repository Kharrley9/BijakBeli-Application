import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import LeafletMap, { MapMarker } from './dom/LeafletMap';

export type { MapMarker };

/**
 * OpenStreetMap map for the app (Leaflet in a web view — see dom/LeafletMap.tsx).
 * Used instead of react-native-maps, whose Android build needs a Google Maps key.
 */
export default function OsmMap({
  style,
  ...props
}: {
  style?: StyleProp<ViewStyle>;
  center: { lat: number; lng: number };
  flyKey?: number;
  zoom?: number;
  markers?: MapMarker[];
  user?: { lat: number; lng: number } | null;
  onMarkerPress?: (id: string) => Promise<void>;
  onMoveEnd?: (c: { lat: number; lng: number }) => Promise<void>;
  onMapPress?: () => Promise<void>;
}) {
  return (
    <LeafletMap
      dom={{ style: StyleSheet.flatten([{ flex: 1 }, style]) as any, scrollEnabled: false, overScrollMode: 'never' }}
      {...props}
    />
  );
}
