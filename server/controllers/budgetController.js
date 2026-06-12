const budgetService = require('../services/budgetService');

exports.setBudget = async (req, res, next) => {
  try {
    const { monthlyBudget, month, year } = req.body;
    const budget = await budgetService.setBudget(req.user._id, monthlyBudget, month, year);
    res.status(200).json({ success: true, data: budget });
  } catch (error) { next(error); }
};

exports.addExpense = async (req, res, next) => {
  try {
    const { amount, month, year } = req.body;
    const budget = await budgetService.addExpense(req.user._id, amount, month, year);
    res.status(200).json({ success: true, data: budget });
  } catch (error) { next(error); }
};

exports.getCurrentBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.getCurrentBudget(req.user._id);
    res.status(200).json({ success: true, data: budget });
  } catch (error) { next(error); }
};

exports.getBudgetHistory = async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgetHistory(req.user._id);
    res.status(200).json({ success: true, data: budgets });
  } catch (error) { next(error); }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    await budgetService.deleteBudget(req.params.id);
    res.status(200).json({ success: true, message: 'Budget deleted' });
  } catch (error) { next(error); }
};
