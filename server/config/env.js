const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/bijakbeli',
  JWT_SECRET: process.env.JWT_SECRET || 'bijakbeli_default_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE) || 30,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Travel-distance comparison
  AVG_DRIVE_SPEED_KMH: parseFloat(process.env.AVG_DRIVE_SPEED_KMH) || 35,
  ROUTING_PROVIDER: process.env.ROUTING_PROVIDER || 'estimate', // 'estimate' | 'ors'
  ROUTING_API_KEY: process.env.ROUTING_API_KEY || '',
  // "Cheapest" is picked among stores within this many km of the buyer
  NEARBY_RADIUS_KM: parseFloat(process.env.NEARBY_RADIUS_KM) || 30,

  // Travel cost (fuel): stores are also ranked by item price + round-trip fuel
  FUEL_PRICE_RM: parseFloat(process.env.FUEL_PRICE_RM) || 1.99, // RM per litre, RON95
  FUEL_L_PER_100KM_CAR: parseFloat(process.env.FUEL_L_PER_100KM_CAR) || 7.0,
  FUEL_L_PER_100KM_MOTORCYCLE: parseFloat(process.env.FUEL_L_PER_100KM_MOTORCYCLE) || 2.5,

  // Daily PriceCatcher refresh (services/priceImportScheduler.js). KPDN updates the
  // data.gov.my files during the day; the run picks up the newest at this hour (MYT).
  PRICE_IMPORT_ENABLED: (process.env.PRICE_IMPORT_ENABLED || 'true').toLowerCase() !== 'false',
  PRICE_IMPORT_HOUR: Math.min(23, Math.max(0, parseInt(process.env.PRICE_IMPORT_HOUR, 10) || 21)),

  // Photo scan (Google Gemini free tier). Google shows each project's own free-tier
  // limits at https://aistudio.google.com/rate-limit — copy them here. The app never
  // sends more than these, and also stops when Gemini itself says a limit is reached.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  // Defaults = Gemini 3.5 Flash Lite free tier as AI Studio showed it on 2026-11-20
  GEMINI_RPM: parseInt(process.env.GEMINI_RPM) || 15, // requests per minute
  GEMINI_RPD: parseInt(process.env.GEMINI_RPD) || 500, // requests per day (resets midnight Pacific time)
};
