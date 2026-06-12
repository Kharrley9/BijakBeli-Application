import { useEffect, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { budgetService } from '../services/dataService';
import Card from '../components/Card';
import type { Budget } from '../types';

const COLORS = ['#16a34a', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function SavingsReport() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await budgetService.getHistory();
      setBudgets(res.data.data || []);
    } catch { /* skip */ }
    setLoading(false);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const chartData = budgets.slice(0, 6).reverse().map((b) => ({
    month: months[b.month - 1],
    budget: b.monthlyBudget,
    spent: b.spentAmount,
    saved: Math.max(b.monthlyBudget - b.spentAmount, 0),
  }));

  const totalSaved = budgets.reduce((acc, b) => acc + Math.max(b.monthlyBudget - b.spentAmount, 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalBudget = budgets.reduce((acc, b) => acc + b.monthlyBudget, 0);

  const pieData = [
    { name: 'Saved', value: totalSaved },
    { name: 'Spent', value: totalSpent },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PiggyBank className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Report</h1>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No data yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Start using the budget planner to see your savings report</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
              <p className="text-3xl font-bold text-primary-500 mt-1">RM {totalSaved.toFixed(2)}</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-3xl font-bold text-accent-400 mt-1">RM {totalSpent.toFixed(2)}</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
              <p className="text-3xl font-bold text-blue-500 mt-1">RM {totalBudget.toFixed(2)}</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Monthly Overview</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="spent" fill="#f97316" radius={[4, 4, 0, 0]} name="Spent" />
                    <Bar dataKey="saved" fill="#16a34a" radius={[4, 4, 0, 0]} name="Saved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Pie Chart */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Savings vs Spending</h3>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `RM ${value.toFixed(2)}`}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-sm text-gray-500">Saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-400" />
                  <span className="text-sm text-gray-500">Spent</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
