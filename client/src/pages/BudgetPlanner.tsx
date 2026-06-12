import { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { budgetService } from '../services/dataService';
import BudgetCard from '../components/BudgetCard';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import type { Budget } from '../types';
import toast from 'react-hot-toast';

export default function BudgetPlanner() {
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [history, setHistory] = useState<Budget[]>([]);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const now = new Date();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentRes, historyRes] = await Promise.allSettled([
        budgetService.getCurrent(),
        budgetService.getHistory(),
      ]);
      if (currentRes.status === 'fulfilled') setCurrentBudget(currentRes.value.data.data);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data.data || []);
    } catch { /* skip */ }
    setLoading(false);
  };

  const handleSetBudget = async () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;
    try {
      await budgetService.setCurrent({
        monthlyBudget: parseFloat(budgetAmount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      toast.success('Budget set!');
      setBudgetAmount('');
      setShowSetModal(false);
      loadData();
    } catch { toast.error('Failed to set budget'); }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) return;
    try {
      await budgetService.addExpense({
        amount: parseFloat(expenseAmount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      toast.success('Expense recorded!');
      setExpenseAmount('');
      setShowExpenseModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Planner</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSetModal(true)}>
            Set Budget
          </Button>
          {currentBudget && (
            <Button size="sm" variant="secondary" onClick={() => setShowExpenseModal(true)}>
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 shimmer rounded-2xl" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <BudgetCard budget={currentBudget} />

          {/* Quick Summary */}
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Budget Summary</h3>
            {currentBudget ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">RM {currentBudget.monthlyBudget.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Budget</p>
                  </div>
                  <div className="text-center p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-accent-500">RM {currentBudget.spentAmount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Spent</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className={`text-2xl font-bold ${currentBudget.remainingAmount < 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                      RM {currentBudget.remainingAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Remaining</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Monthly Progress</span>
                    <span>{((currentBudget.spentAmount / currentBudget.monthlyBudget) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        currentBudget.spentAmount > currentBudget.monthlyBudget
                          ? 'bg-red-500'
                          : currentBudget.spentAmount > currentBudget.monthlyBudget * 0.75
                          ? 'bg-accent-400'
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min((currentBudget.spentAmount / currentBudget.monthlyBudget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Set a monthly budget to start tracking</p>
                <Button onClick={() => setShowSetModal(true)}>Set Your Budget</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget History</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((b) => (
              <Card key={b._id} hover>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{months[b.month - 1]} {b.year}</p>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-xs text-gray-500">Spent</p>
                    <p className="font-semibold text-accent-500">RM {b.spentAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="font-semibold text-gray-900 dark:text-white">RM {b.monthlyBudget.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      <Modal isOpen={showSetModal} onClose={() => setShowSetModal(false)} title="Set Monthly Budget">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Monthly Budget (RM)
            </label>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="e.g., 500"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <Button onClick={handleSetBudget} className="w-full">Save Budget</Button>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record Expense">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Amount (RM)
            </label>
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="e.g., 50.00"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <Button onClick={handleAddExpense} className="w-full" variant="secondary">Record Expense</Button>
        </div>
      </Modal>
    </div>
  );
}
