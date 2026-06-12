import type { Budget } from '../types';

interface BudgetCardProps {
  budget: Budget | null;
}

export default function BudgetCard({ budget }: BudgetCardProps) {
  if (!budget) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 text-center">
        <div className="text-4xl mb-3">💰</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No budget set for this month</p>
      </div>
    );
  }

  const percentage = budget.monthlyBudget > 0
    ? Math.min((budget.spentAmount / budget.monthlyBudget) * 100, 100)
    : 0;

  const isOverBudget = budget.spentAmount > budget.monthlyBudget;
  const strokeColor = isOverBudget ? '#ef4444' : percentage > 75 ? '#f97316' : '#16a34a';

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Monthly Budget</h3>
      
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-700" />
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {percentage.toFixed(0)}%
            </span>
            <span className="text-xs text-gray-500">used</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Budget</span>
          <span className="font-semibold text-gray-900 dark:text-white">RM {budget.monthlyBudget.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Spent</span>
          <span className="font-semibold text-accent-400">RM {budget.spentAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-100 dark:border-slate-700 pt-2">
          <span className="text-gray-500 dark:text-gray-400">Remaining</span>
          <span className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-primary-500'}`}>
            RM {budget.remainingAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
