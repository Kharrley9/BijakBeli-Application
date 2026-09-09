/**
 * OpenRouteService Matrix provider — STUB, not wired up yet.
 *
 * To enable real driving distances later:
 *   1. Get a free key at https://openrouteservice.org/dev/#/signup
 *   2. Set ROUTING_PROVIDER=ors and ROUTING_API_KEY=<key> in server/.env
 *   3. Implement getMatrix() below (POST https://api.openrouteservice.org/v2/matrix/driving-car
 *      with { locations: [[lng,lat], ...], metrics: ['distance','duration'] };
 *      index 0 is the origin, the rest are destinations in order).
 *   4. Return an array aligned with `destinations`:
 *        [{ distanceKm: number, durationMin: number }, ...]
 *
 * geoService falls back to the offline estimate whenever this throws.
 */

// eslint-disable-next-line no-unused-vars
async function getMatrix(origin, destinations) {
  throw new Error('orsProvider.getMatrix not implemented');
}

module.exports = { getMatrix };
