const logger = require('../utils/logger');
const geoService = require('./geoService');

/**
 * Nearest shopping malls to a point, from OpenStreetMap via Nominatim.
 * Free, no API key. https://nominatim.org/release-docs/latest/api/Search/
 *
 * We search "mall" inside a bounding box around the user and keep results that
 * OSM tags shop=mall. Coverage depends on OSM contributors, so a few malls may
 * be missing or named differently than on Google.
 *
 * Nominatim usage policy: identify the app (User-Agent), max 1 request/second,
 * cache results. Lookups here are cached per ~110 m cell for 10 minutes.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BijakBeli/1.0 (student project; nearest-mall lookup)';

const DEFAULT_RADIUS_M = 10000;
const MAX_RADIUS_M = 50000;

// --- tiny in-process cache (same idea as geoService) -----------------------
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

const cacheKey = (lat, lng, radiusM, limit) =>
  `${lat.toFixed(3)},${lng.toFixed(3)}|${radiusM}|${limit}`;

/** Bounding box [west,north,east,south] covering `radiusM` around the point. */
function viewbox({ lat, lng }, radiusM) {
  const dLat = radiusM / 1000 / 111;
  const dLng = radiusM / 1000 / (111 * Math.cos((lat * Math.PI) / 180));
  return [lng - dLng, lat + dLat, lng + dLng, lat - dLat].map((n) => n.toFixed(5)).join(',');
}

/**
 * @param {{lat:number,lng:number}} origin
 * @param {{radiusM?:number, limit?:number}} [opts]
 * @returns {Promise<Array>} malls: { placeId, name, address, lat, lng, distanceKm },
 *   sorted nearest-first.
 */
async function getNearbyMalls(origin, { radiusM = DEFAULT_RADIUS_M, limit = 5 } = {}) {
  if (!geoService.isValidCoord(origin)) {
    const error = new Error('Valid lat and lng are required');
    error.statusCode = 400;
    throw error;
  }

  const radius = Math.min(Math.max(Number(radiusM) || DEFAULT_RADIUS_M, 100), MAX_RADIUS_M);
  const count = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);

  const key = cacheKey(origin.lat, origin.lng, radius, count);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.value;

  const params = new URLSearchParams({
    q: 'mall',
    format: 'jsonv2',
    limit: '40',
    countrycodes: 'my',
    bounded: '1',
    viewbox: viewbox(origin, radius),
  });

  let rows;
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = await res.json();
  } catch (err) {
    logger.warn(`Nominatim mall search failed: ${err.message}`);
    const error = new Error('Could not look up nearby malls right now');
    error.statusCode = 502;
    throw error;
  }

  const malls = rows
    .filter((r) => r.category === 'shop' && r.type === 'mall')
    .map((r) => {
      const lat = Number(r.lat);
      const lng = Number(r.lon);
      return {
        placeId: `${r.osm_type}/${r.osm_id}`,
        name: r.name || String(r.display_name).split(',')[0],
        address: r.display_name,
        lat,
        lng,
        distanceKm: Math.round(geoService.haversineKm(origin, { lat, lng }) * 10) / 10,
      };
    })
    .filter((m) => m.distanceKm * 1000 <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);

  cache.set(key, { ts: Date.now(), value: malls });
  return malls;
}

module.exports = { getNearbyMalls };
