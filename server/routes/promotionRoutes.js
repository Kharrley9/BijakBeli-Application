const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/active', ctrl.getActive);
router.get('/best-deals', ctrl.getBestDeals);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', protect, authorize('admin'), ctrl.create);
router.put('/:id', protect, authorize('admin'), ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.delete);

module.exports = router;
