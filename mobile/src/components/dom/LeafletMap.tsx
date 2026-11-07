'use dom';
/**
 * LeafletMap — an OpenStreetMap map drawn with Leaflet inside Expo's built-in
 * web view (an Expo "DOM component"). No Google Maps SDK or API key involved,
 * and no native rebuild needed. Props must be plain data; the callbacks become
 * async calls back into React Native.
 *
 * OSM tile policy requires visible attribution (shown bottom-right):
 * https://operations.osmfoundation.org/policies/tiles/
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import type { DOMProps } from 'expo/dom';

export type MapMarker = { id: string; lat: number; lng: number; color: string };
type Pt = { lat: number; lng: number };

export default function LeafletMap({
  center,
  flyKey = 0,
  zoom = 14,
  markers = [],
  user,
  onMarkerPress,
  onMoveEnd,
  onMapPress,
}: {
  dom?: DOMProps;
  center: Pt;
  /** Bump this number to make the map fly to `center`. */
  flyKey?: number;
  zoom?: number;
  markers?: MapMarker[];
  /** Blue "you are here" dot. */
  user?: Pt | null;
  onMarkerPress?: (id: string) => Promise<void>;
  /** Fires after the user (or a fly) moves the map; gives the new centre. */
  onMoveEnd?: (c: Pt) => Promise<void>;
  onMapPress?: () => Promise<void>;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  // Keep the latest callbacks without re-creating the map.
  const cb = useRef({ onMarkerPress, onMoveEnd, onMapPress });
  cb.current = { onMarkerPress, onMoveEnd, onMapPress };

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false }).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(m);
    m.attributionControl.setPrefix(false);
    layer.current = L.layerGroup().addTo(m);
    m.on('moveend', () => {
      const c = m.getCenter();
      cb.current.onMoveEnd?.({ lat: c.lat, lng: c.lng });
    });
    m.on('click', () => cb.current.onMapPress?.());
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to `center` whenever flyKey changes (skip the first run — init already centred).
  const firstFly = useRef(true);
  useEffect(() => {
    if (firstFly.current) {
      firstFly.current = false;
      return;
    }
    map.current?.setView([center.lat, center.lng], zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyKey]);

  // Redraw markers + user dot.
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.forEach((mk) => {
      const icon = L.divIcon({
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        html: `<div style="width:22px;height:22px;border-radius:50%;background:${mk.color};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></div>`,
      });
      L.marker([mk.lat, mk.lng], { icon })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          cb.current.onMarkerPress?.(mk.id);
        })
        .addTo(g);
    });
    if (user) {
      L.circleMarker([user.lat, user.lng], {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#1976D2',
        fillOpacity: 1,
      }).addTo(g);
    }
  }, [markers, user?.lat, user?.lng]);

  return <div ref={el} style={{ position: 'absolute', inset: 0 }} />;
}
