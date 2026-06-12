import { Settings as SettingsIcon, Moon, Sun, Bell, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-gray-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Appearance */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          Appearance
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${isDark ? 'translate-x-7' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Price Drop Alerts', desc: 'Get notified when prices drop on your favorites' },
            { label: 'Promotion Alerts', desc: 'New promotions from your preferred stores' },
            { label: 'Budget Warnings', desc: 'Alert when approaching budget limit' },
            { label: 'Weekly Report', desc: 'Weekly savings summary' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <button className="relative w-12 h-6 rounded-full bg-primary-500 transition-colors">
                <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <p className="font-medium text-gray-900 dark:text-white text-sm">Two-Factor Authentication</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
            <span className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Coming Soon</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <p className="font-medium text-gray-900 dark:text-white text-sm">Login History</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">View your recent login activity</p>
            <span className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Coming Soon</span>
          </div>
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">BijakBeli</span>
          </div>
          <p className="text-sm text-gray-500">Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">Smart Grocery Price Comparison System</p>
        </div>
      </Card>
    </div>
  );
}
