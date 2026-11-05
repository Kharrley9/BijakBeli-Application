const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/placesController');

router.get('/malls', ctrl.getNearbyMalls);

module.exports = router;
