const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getAllStores);
router.get('/:id', ctrl.getStore);
router.post('/', protect, authorize('admin'), ctrl.createStore);
router.put('/:id', protect, authorize('admin'), ctrl.updateStore);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteStore);

module.exports = router;
