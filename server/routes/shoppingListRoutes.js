const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shoppingListController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes require auth

router.post('/', ctrl.createList);
router.get('/', ctrl.getUserLists);
router.get('/:id', ctrl.getListById);
router.delete('/:id', ctrl.deleteList);
router.post('/:id/items', ctrl.addItem);
router.put('/:id/items/:itemId', ctrl.updateItem);
router.delete('/:id/items/:itemId', ctrl.removeItem);
router.get('/:id/compare', ctrl.compareStores);

module.exports = router;
