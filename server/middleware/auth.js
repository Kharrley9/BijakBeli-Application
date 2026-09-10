const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Require the caller to own a merchant store. Attaches `req.store`.
// Use after `protect`.
const requireOwnStore = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ ownerId: req.user._id });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'You have not registered a store yet',
      });
    }
    req.store = store;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, authorize, requireOwnStore };
