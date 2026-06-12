import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../services/dataService';
import ProductCard from '../components/ProductCard';
import type { FavoriteProduct } from '../types';
import toast from 'react-hot-toast';

export default function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await favoriteService.getAll();
      setFavorites(res.data.data || []);
    } catch { /* skip */ }
    setLoading(false);
  };

  const handleToggleFavorite = async (productId: string) => {
    try {
      await favoriteService.toggle(productId);
      toast.success('Removed from favorites');
      loadFavorites();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
        <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-semibold rounded-full">
          {favorites.length} items
        </span>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="h-48 shimmer" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-full shimmer rounded" />
                <div className="h-6 w-24 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Save products you love to find them quickly</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <ProductCard
              key={fav._id}
              product={fav.productId}
              isFavorite={true}
              onToggleFavorite={handleToggleFavorite}
              onCompare={(id) => navigate(`/compare?product=${id}`)}
              onClick={() => navigate(`/products/${fav.productId._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
