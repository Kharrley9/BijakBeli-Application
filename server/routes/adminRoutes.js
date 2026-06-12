const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', ctrl.getDashboardStats);
router.get('/users', ctrl.getAllUsers);
router.delete('/users/:id', ctrl.deleteUser);

module.exports = router;
