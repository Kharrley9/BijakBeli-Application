const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Travel-distance helpers for store comparison.
 *
 * Providers (ROUTING_PROVIDER):
 *   'estimate' (default): straight-line (haversine) distance plus a drive-time
 *       estimate from AVG_DRIVE_SPEED_KMH. No network, no API key.
 *   'ors': real road distance/time from OpenRouteService (providers/orsProvider.js,
 *       needs ROUTING_API_KEY). Falls back to 'estimate' on any failure.
 *
 * Each entry also carries `roadKm` (the one-way road distance, estimated as
 * 1.3x straight line when offline), which travelCostRm() turns into round-trip
 * fuel cost.
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
const ROAD_DETOUR = 1.3;
// Stores farther than this (straight line) are estimated, not sent to ORS.
const ORS_MAX_STRAIGHT_KM = 60;

function estimateDurationMin(straightKm) {
  const roadKm = straightKm * ROAD_DETOUR;
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
      // Only route stores a buyer might actually drive to; the free ORS quota is
      // small, and for far-away stores the estimate is close enough.
      const near = withCoords.filter((s) => haversineKm(origin, s.coord) <= ORS_MAX_STRAIGHT_KM);
      const matrix = near.length ? await ors.getMatrix(origin, near.map((s) => s.coord)) : [];
      const routed = new Map(near.map((s, i) => [s.id, matrix[i]]));
      entries = withCoords.map((s) => {
        const m = routed.get(s.id);
        return [
          s.id,
          m
            ? {
                distanceKm: round1(m.distanceKm),
                roadKm: round1(m.distanceKm),
                durationMin: Math.round(m.durationMin),
                source: 'ors',
              }
            : estimateEntry(origin, s.coord), // too far to route, or ORS found no road
        ];
      });
    } catch (err) {
      logger.warn(`ORS routing failed, falling back to estimate: ${err.message}`);
      entries = null;
    }
  }

  if (!entries) {
    entries = withCoords.map((s) => [s.id, estimateEntry(origin, s.coord)]);
  }

  cache.set(key, { ts: Date.now(), value: entries });
  return new Map(entries);
}

/** Offline estimate: straight-line distance shown, 1.3x road detour for time and fuel. */
function estimateEntry(origin, coord) {
  const km = haversineKm(origin, coord);
  return {
    distanceKm: round1(km),
    roadKm: round1(km * ROAD_DETOUR),
    durationMin: estimateDurationMin(km),
    source: 'estimate',
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// --- "nearby" -------------------------------------------------------------

/** Stores within this distance count as "nearby" for cheapest-price picks. */
const NEARBY_RADIUS_KM = config.NEARBY_RADIUS_KM;

/**
 * Rows (anything with `store.distanceKm`, or `distanceKm` directly) within the
 * nearby radius. Empty when distances are unknown (no buyer location).
 */
function withinNearbyRadius(rows) {
  return rows.filter((r) => {
    const d = r.store ? r.store.distanceKm : r.distanceKm;
    return typeof d === 'number' && d <= NEARBY_RADIUS_KM;
  });
}

// --- travel (fuel) cost ----------------------------------------------------

const VEHICLES = ['car', 'motorcycle'];

/**
 * Fuel assumptions for a request. `vehicle` comes from the app's settings;
 * anything unrecognised falls back to a car.
 * @param {string} [vehicle] 'car' | 'motorcycle'
 */
function fuelAssumptions(vehicle) {
  const v = VEHICLES.includes(vehicle) ? vehicle : 'car';
  return {
    vehicle: v,
    fuelPriceRm: config.FUEL_PRICE_RM,
    litresPer100Km:
      v === 'motorcycle' ? config.FUEL_L_PER_100KM_MOTORCYCLE : config.FUEL_L_PER_100KM_CAR,
    roundTrip: true,
  };
}

/**
 * Fuel cost in RM to drive to a store and back.
 * @param {number} roadKm one-way road distance
 * @param {ReturnType<typeof fuelAssumptions>} fuel
 */
function travelCostRm(roadKm, fuel) {
  if (typeof roadKm !== 'number' || !Number.isFinite(roadKm)) return null;
  const km = fuel.roundTrip ? roadKm * 2 : roadKm;
  return Math.round(((km * fuel.litresPer100Km) / 100) * fuel.fuelPriceRm * 100) / 100;
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
  fuelAssumptions,
  travelCostRm,
  withinNearbyRadius,
  NEARBY_RADIUS_KM,
};
