import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { promotionService, storeService } from '../services/dataService';
import PromotionCard from '../components/PromotionCard';
import type { Promotion, Store } from '../types';

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promoRes, storeRes] = await Promise.all([
        promotionService.getActive(),
        storeService.getAll(),
      ]);
      setPromotions(promoRes.data.data || []);
      setStores(storeRes.data.data || []);
    } catch { /* error */ }
    setLoading(false);
  };

  const filtered = selectedStore
    ? promotions.filter((p) => {
        const storeId = typeof p.storeId === 'object' ? p.storeId._id : p.storeId;
        return storeId === selectedStore;
      })
    : promotions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-accent-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Promotions</h1>
          <span className="px-3 py-1 bg-accent-50 dark:bg-accent-900/20 text-accent-500 text-sm font-semibold rounded-full">
            {filtered.length} deals
          </span>
        </div>

        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>{s.storeName}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="h-32 shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-full shimmer rounded" />
                <div className="h-6 w-24 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No active promotions</h3>
          <p className="text-gray-500 dark:text-gray-400">Check back later for new deals</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((promo) => (
            <PromotionCard key={promo._id} promotion={promo} />
          ))}
        </div>
      )}
    </div>
  );
}
