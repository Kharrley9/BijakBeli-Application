const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const priceImportScheduler = require('./services/priceImportScheduler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const storeRoutes = require('./routes/storeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const priceRoutes = require('./routes/priceRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const placesRoutes = require('./routes/placesRoutes');
const photoRoutes = require('./routes/photoRoutes');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — allow all origins in development for Expo mobile connections
app.use(
  cors({
    origin: config.NODE_ENV === 'development' ? '*' : config.CLIENT_URL,
    credentials: config.NODE_ENV !== 'development',
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/photos', photoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BijakBeli API is running',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    priceImport: priceImportScheduler.getStatus(),
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info(`BijakBeli Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  // Daily KPDN PriceCatcher refresh (not when this file is only required, e.g. by tests)
  if (require.main === module) priceImportScheduler.start();
});

module.exports = app;
