import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { productService, priceService, favoriteService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import type { Product, PriceComparison } from '../types';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const [prodRes, priceRes] = await Promise.all([
        productService.getById(id!),
        priceService.compare(id!),
      ]);
      setProduct(prodRes.data.data);
      setComparisons(priceRes.data.data?.comparisons || []);

      if (isAuthenticated) {
        try {
          const favRes = await favoriteService.check(id!);
          setIsFavorite(favRes.data.data?.isFavorite || false);
        } catch { /* skip */ }
      }
    } catch { toast.error('Failed to load product'); }
    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) return toast.error('Please login to save favorites');
    try {
      const res = await favoriteService.toggle(id!);
      setIsFavorite(res.data.data.isFavorite);
      toast.success(res.data.data.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch { toast.error('Failed'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-bounce">🛒</div></div>;
  }

  if (!product) {
    return <div className="text-center py-20"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product not found</h3></div>;
  }

  const categoryName = typeof product.categoryId === 'object' ? product.categoryId.categoryName : '';
  const brandName = typeof product.brandId === 'object' ? product.brandId.brandName : '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <Card padding="none" className="overflow-hidden">
          <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl">🛒</div>
            )}
          </div>
        </Card>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {categoryName && <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-xs font-medium rounded-full">{categoryName}</span>}
              {brandName && <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">{brandName}</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.productName}</h1>
            {product.description && <p className="text-gray-500 dark:text-gray-400 mt-2">{product.description}</p>}
            <p className="text-sm text-gray-400 mt-1">Unit: {product.unit} • Barcode: {product.barcode || 'N/A'}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleToggleFavorite}>
              <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/shopping-list')}>
              <ShoppingCart className="w-5 h-5 mr-2" /> Add to List
            </Button>
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary-500" /> Price Comparison
        </h2>
        {comparisons.length === 0 ? (
          <Card><p className="text-gray-500 text-center py-8">No price data available</p></Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {comparisons.map((comp, i) => (
              <Card key={i} hover className={`relative ${comp.isLowestPrice ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {comp.isLowestPrice && <span className="badge-lowest">🏆 Lowest Price</span>}
                  {comp.isBestPromotion && <span className="badge-promo">⭐ Best Promo</span>}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{comp.store.storeName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{comp.store.mallName}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Regular Price</span>
                    <span className={`font-medium ${comp.hasPromotion ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      RM {comp.currentPrice.toFixed(2)}
                    </span>
                  </div>
                  {comp.hasPromotion && comp.promotion && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-accent-500">Promo Price</span>
                        <span className="font-bold text-accent-500">RM {comp.promotion.promotionPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-medium text-primary-500">{comp.promotion.discountPercentage}%</span>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Price</span>
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        RM {comp.effectivePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
