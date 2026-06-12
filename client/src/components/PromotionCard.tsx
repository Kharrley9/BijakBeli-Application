import { Clock, Tag } from 'lucide-react';
import type { Promotion } from '../types';

interface PromotionCardProps {
  promotion: Promotion;
  onClick?: () => void;
}

export default function PromotionCard({ promotion, onClick }: PromotionCardProps) {
  const product = typeof promotion.productId === 'object' ? promotion.productId : null;
  const store = typeof promotion.storeId === 'object' ? promotion.storeId : null;

  const endDate = new Date(promotion.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden card-hover cursor-pointer"
    >
      {/* Banner */}
      <div className="relative h-32 gradient-accent flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xs font-medium opacity-80 mb-1">{store?.storeName}</p>
          <p className="text-2xl font-bold">{promotion.discountPercentage}% OFF</p>
          <p className="text-sm opacity-90">{promotion.promotionTitle}</p>
        </div>
        {/* Type badge */}
        <span className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
          <Tag className="inline w-3 h-3 mr-1" />
          {promotion.promotionType}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {product && (
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
            {product.productName}
          </h3>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-accent-400">
            RM {promotion.promotionPrice.toFixed(2)}
          </span>
          {store && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              at {store.storeName}
            </span>
          )}
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-1 text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          <Clock className="w-3.5 h-3.5" />
          {daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'}
        </div>
      </div>
    </div>
  );
}
