const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Travel-distance helpers for store comparison.
 *
 * Current provider: 'estimate' — straight-line (haversine) distance plus a
 * drive-time estimate from AVG_DRIVE_SPEED_KMH. No network, no API key.
 *
 * A real routing provider (OpenRouteService, Google Distance Matrix) can be
 * plugged in later by implementing `providers/<name>Provider.js` with the same
 * `getMatrix(origin, destinations)` shape and switching ROUTING_PROVIDER — no
 * schema or endpoint change required.
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * @param {{lat:number,lng:number}} a
 * @param {{lat:number,lng:number}} b
 * @returns {number} kilometres, straight line
 */
function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Rough drive time. Adds a ~1.3x detour factor over the straight line since
 * roads are never direct, then divides by the configured average speed.
 * @param {number} straightKm
 * @returns {number} minutes, rounded
 */
function estimateDurationMin(straightKm) {
  const roadKm = straightKm * 1.3;
  const speed = config.AVG_DRIVE_SPEED_KMH || 35;
  return Math.round((roadKm / speed) * 60);
}

function isValidCoord(c) {
  return (
    c &&
    typeof c.lat === 'number' &&
    typeof c.lng === 'number' &&
    !(c.lat === 0 && c.lng === 0) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180
  );
}

/** Pull a {lat,lng} out of a Mongo GeoJSON Point ([lng, lat]). */
function pointToLatLng(point) {
  const coords = point && point.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  const c = { lat, lng };
  return isValidCoord(c) ? c : null;
}

// --- tiny in-process cache -------------------------------------------------
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

function cacheKey(origin, storeIds) {
  const o = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
  return `${o}|${[...storeIds].sort().join(',')}`;
}

/**
 * Distances/durations from one origin to a list of stores.
 * @param {{lat:number,lng:number}} origin
 * @param {Array<{_id:any, location?:object}>} stores  Mongo Store docs (lean or not)
 * @returns {Promise<Map<string, {distanceKm:number, durationMin:number, source:string}>>}
 *          keyed by store _id string; stores without valid coords are omitted.
 */
async function getStoreDistances(origin, stores) {
  if (!isValidCoord(origin) || !Array.isArray(stores) || stores.length === 0) {
    return new Map();
  }

  const withCoords = stores
    .map((s) => ({ id: String(s._id), coord: pointToLatLng(s.location) }))
    .filter((s) => s.coord);

  if (withCoords.length === 0) return new Map();

  const key = cacheKey(
    origin,
    withCoords.map((s) => s.id)
  );
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return new Map(hit.value);
  }

  let entries;
  const provider = config.ROUTING_PROVIDER;

  if (provider === 'ors' && config.ROUTING_API_KEY) {
    try {
      // eslint-disable-next-line global-require
      const ors = require('./providers/orsProvider');
      const matrix = await ors.getMatrix(
        origin,
        withCoords.map((s) => s.coord)
      );
      entries = withCoords.map((s, i) => [
        s.id,
        {
          distanceKm: round1(matrix[i].distanceKm),
          durationMin: Math.round(matrix[i].durationMin),
          source: 'ors',
        },
      ]);
    } catch (err) {
      logger.warn(`ORS routing failed, falling back to estimate: ${err.message}`);
      entries = null;
    }
  }

  if (!entries) {
    entries = withCoords.map((s) => {
      const km = haversineKm(origin, s.coord);
      return [
        s.id,
        {
          distanceKm: round1(km),
          durationMin: estimateDurationMin(km),
          source: 'estimate',
        },
      ];
    });
  }

  cache.set(key, { ts: Date.now(), value: entries });
  return new Map(entries);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Given a distance map and a list of store-like objects (each with `_id`),
 * return the id of the nearest one, or null.
 */
function pickNearestId(distanceMap, storeIds) {
  let bestId = null;
  let best = Infinity;
  for (const id of storeIds) {
    const d = distanceMap.get(String(id));
    if (d && d.distanceKm < best) {
      best = d.distanceKm;
      bestId = String(id);
    }
  }
  return bestId;
}

module.exports = {
  haversineKm,
  estimateDurationMin,
  isValidCoord,
  pointToLatLng,
  getStoreDistances,
  pickNearestId,
};
