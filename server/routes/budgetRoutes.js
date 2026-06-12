const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', ctrl.setBudget);
router.post('/expense', ctrl.addExpense);
router.get('/current', ctrl.getCurrentBudget);
router.get('/history', ctrl.getBudgetHistory);
router.delete('/:id', ctrl.deleteBudget);

module.exports = router;
