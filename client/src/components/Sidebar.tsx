import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ArrowRightLeft, Tag, ShoppingCart,
  Calculator, PiggyBank, Heart, User, Bell, Settings,
  Store, Users, BarChart3, Layers, X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const customerLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/compare', icon: ArrowRightLeft, label: 'Compare Prices' },
  { to: '/promotions', icon: Tag, label: 'Promotions' },
  { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
  { to: '/budget', icon: Calculator, label: 'Budget Planner' },
  { to: '/savings', icon: PiggyBank, label: 'Savings Report' },
  { to: '/favorites', icon: Heart, label: 'Favorites' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Manage Users' },
  { to: '/admin/products', icon: Package, label: 'Manage Products' },
  { to: '/admin/categories', icon: Layers, label: 'Manage Categories' },
  { to: '/admin/brands', icon: Tag, label: 'Manage Brands' },
  { to: '/admin/stores', icon: Store, label: 'Manage Stores' },
  { to: '/admin/prices', icon: ArrowRightLeft, label: 'Manage Prices' },
  { to: '/admin/promotions', icon: Tag, label: 'Manage Promotions' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : customerLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 
          border-r border-gray-100 dark:border-slate-700
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Bijak<span className="text-primary-500">Beli</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 lg:hidden transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {user?.role === 'admin' ? 'Administration' : 'Menu'}
          </p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
