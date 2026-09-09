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
  MAX_FILE_UPLOAD: parseInt(process.env.MAX_FILE_UPLOAD) || 5000000,
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || './uploads',

  // Travel-distance comparison
  AVG_DRIVE_SPEED_KMH: parseFloat(process.env.AVG_DRIVE_SPEED_KMH) || 35,
  ROUTING_PROVIDER: process.env.ROUTING_PROVIDER || 'estimate', // 'estimate' | 'ors'
  ROUTING_API_KEY: process.env.ROUTING_API_KEY || '',
};
