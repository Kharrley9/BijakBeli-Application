import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Store, Tag, TrendingDown, ShoppingCart, Calculator, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { promotionService, adminService } from '../services/dataService';
import type { Promotion, DashboardStats } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promoRes, statsRes] = await Promise.allSettled([
        promotionService.getBestDeals(),
        user?.role === 'admin' ? adminService.getStats() : Promise.resolve(null),
      ]);
      if (promoRes.status === 'fulfilled' && promoRes.value) {
        setPromotions(promoRes.value.data.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value.data.data);
      }
    } catch { /* silent */ }
  };

  const quickActions = [
    { icon: Package, label: 'Browse Products', to: '/products', color: 'bg-blue-500' },
    { icon: TrendingDown, label: 'Compare Prices', to: '/compare', color: 'bg-primary-500' },
    { icon: Tag, label: 'View Promotions', to: '/promotions', color: 'bg-accent-400' },
    { icon: ShoppingCart, label: 'Shopping List', to: '/shopping-list', color: 'bg-purple-500' },
    { icon: Calculator, label: 'Budget Planner', to: '/budget', color: 'bg-pink-500' },
    { icon: Store, label: 'Stores', to: '/products', color: 'bg-teal-500' },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-sm text-white/70 mb-1">{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            {isAdmin ? 'Admin Dashboard' : `Welcome back, ${user?.fullName?.split(' ')[0]}! 👋`}
          </h1>
          <p className="text-white/80 max-w-lg">
            {isAdmin
              ? 'Manage your store data, products, and view analytics.'
              : 'Find the best deals and save money on your grocery shopping today.'}
          </p>
        </div>
      </motion.div>

      {/* Admin Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'text-blue-500' },
            { label: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'text-primary-500' },
            { label: 'Total Stores', value: stats.totalStores, icon: '🏪', color: 'text-accent-400' },
            { label: 'Active Promos', value: stats.activePromotions, icon: '🎉', color: 'text-purple-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{stat.icon}</span>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={action.to}>
                <Card hover className="text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Best Deals */}
      {promotions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🔥 Best Deals Today</h2>
            <Link to="/promotions" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {promotions.slice(0, 4).map((promo, i) => {
              const product = typeof promo.productId === 'object' ? promo.productId : null;
              const store = typeof promo.storeId === 'object' ? promo.storeId : null;
              return (
                <motion.div
                  key={promo._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card hover>
                    <div className="flex items-start justify-between mb-3">
                      <span className="badge-promo">{promo.discountPercentage}% OFF</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{store?.storeName}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                      {product?.productName || promo.promotionTitle}
                    </h3>
                    <p className="text-lg font-bold text-accent-400">
                      RM {promo.promotionPrice.toFixed(2)}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
