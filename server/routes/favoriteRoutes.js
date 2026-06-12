const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getUserFavorites);
router.post('/:productId', ctrl.toggle);
router.get('/:productId/check', ctrl.checkFavorite);

module.exports = router;
