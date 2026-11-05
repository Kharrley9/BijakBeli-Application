const config = require('../../config/env');

/**
 * OpenRouteService Matrix provider: real driving distance and time by road.
 *
 * Setup:
 *   1. Get a free key at https://openrouteservice.org/dev/#/signup
 *   2. In server/.env set ROUTING_PROVIDER=ors and ROUTING_API_KEY=<key>
 *
 * API: POST https://api.openrouteservice.org/v2/matrix/driving-car
 * https://openrouteservice.org/dev/#/api-docs/matrix_service
 *
 * geoService falls back to the offline estimate whenever this throws, and for
 * any single destination ORS cannot route to (returned as null here).
 */

const ENDPOINT = 'https://api.openrouteservice.org/v2/matrix/driving-car';

// The free plan caps a request at 3500 origin x destination pairs and limits
// how many locations one request may hold. We only ever ask 1 origin x N
// destinations, so small chunks keep every request well inside both limits.
const CHUNK = 49;

async function requestChunk(origin, chunk) {
  const locations = [[origin.lng, origin.lat], ...chunk.map((d) => [d.lng, d.lat])];
  const destinations = chunk.map((_, i) => i + 1);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: config.ROUTING_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      locations,
      sources: [0],
      destinations,
      metrics: ['distance', 'duration'],
      units: 'km',
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.error || '';
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`ORS HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const body = await res.json();
  const distances = body?.distances?.[0];
  const durations = body?.durations?.[0];
  if (!Array.isArray(distances) || distances.length !== chunk.length) {
    throw new Error('ORS returned an unexpected matrix shape');
  }

  return distances.map((km, i) => {
    const sec = durations ? durations[i] : null;
    // null = ORS could not route to this point (e.g. it is off the road network)
    if (typeof km !== 'number' || typeof sec !== 'number') return null;
    return { distanceKm: km, durationMin: sec / 60 };
  });
}

/**
 * @param {{lat:number,lng:number}} origin
 * @param {Array<{lat:number,lng:number}>} destinations
 * @returns {Promise<Array<{distanceKm:number, durationMin:number} | null>>}
 *   aligned with `destinations`; null where no road route was found.
 */
async function getMatrix(origin, destinations) {
  if (!config.ROUTING_API_KEY) throw new Error('ROUTING_API_KEY is not set');

  const out = [];
  for (let i = 0; i < destinations.length; i += CHUNK) {
    // Sequential on purpose: the free plan also rate-limits requests per minute.
    // eslint-disable-next-line no-await-in-loop
    out.push(...(await requestChunk(origin, destinations.slice(i, i + CHUNK))));
  }
  return out;
}

module.exports = { getMatrix };
