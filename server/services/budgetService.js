const budgetRepository = require('../repositories/budgetRepository');

class BudgetService {
  async setBudget(userId, monthlyBudget, month, year) {
    const existing = await budgetRepository.findByUserAndMonth(userId, month, year);

    if (existing) {
      existing.monthlyBudget = monthlyBudget;
      existing.remainingAmount = monthlyBudget - existing.spentAmount;
      await existing.save();
      return existing;
    }

    return await budgetRepository.create({
      userId,
      monthlyBudget,
      spentAmount: 0,
      remainingAmount: monthlyBudget,
      month,
      year,
    });
  }

  async addExpense(userId, amount, month, year) {
    let budget = await budgetRepository.findByUserAndMonth(userId, month, year);

    if (!budget) {
      const error = new Error('No budget set for this month');
      error.statusCode = 400;
      throw error;
    }

    budget.spentAmount += amount;
    budget.remainingAmount = budget.monthlyBudget - budget.spentAmount;
    await budget.save();
    return budget;
  }

  async getCurrentBudget(userId) {
    const now = new Date();
    return await budgetRepository.findByUserAndMonth(
      userId,
      now.getMonth() + 1,
      now.getFullYear()
    );
  }

  async getBudgetHistory(userId) {
    return await budgetRepository.findByUser(userId);
  }

  async deleteBudget(id) {
    return await budgetRepository.delete(id);
  }
}

module.exports = new BudgetService();
