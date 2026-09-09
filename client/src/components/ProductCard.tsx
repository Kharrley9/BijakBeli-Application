import { Heart, ArrowRightLeft } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  priceRange?: { min: number; max: number };
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  onCompare?: (productId: string) => void;
  onClick?: () => void;
}

export default function ProductCard({
  product,
  priceRange,
  isFavorite = false,
  onToggleFavorite,
  onCompare,
  onClick,
}: ProductCardProps) {
  const categoryName = typeof product.categoryId === 'object' ? product.categoryId.categoryName : '';
  const brandName = typeof product.brandId === 'object' ? product.brandId.brandName : '';

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden card-hover cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl">🛒</div>
        )}
        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(product._id); }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        )}
        {/* Category badge */}
        {categoryName && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-primary-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
            {categoryName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {brandName && (
          <p className="text-xs font-medium text-primary-500 mb-1">{brandName}</p>
        )}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
          {product.productName}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{product.unit}</p>

        {/* Price range */}
        {priceRange && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                RM {priceRange.min.toFixed(2)}
              </span>
              {priceRange.max > priceRange.min && (
                <span className="text-sm text-gray-400 ml-1">
                  - RM {priceRange.max.toFixed(2)}
                </span>
              )}
            </div>
            {priceRange.max > priceRange.min && (
              <span className="text-xs font-medium text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-full">
                Save RM {(priceRange.max - priceRange.min).toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Compare button */}
        {onCompare && (
          <button
            onClick={(e) => { e.stopPropagation(); onCompare(product._id); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Compare Prices
          </button>
        )}
      </div>
    </div>
  );
}
