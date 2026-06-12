import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';
import { productService, priceService } from '../services/dataService';
import SearchBar from '../components/SearchBar';
import Card from '../components/Card';
import type { Product, PriceComparison } from '../types';

export default function PriceComparison() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [savings, setSavings] = useState(0);
  const [loading, setLoading] = useState(false);

  const productId = searchParams.get('product');

  useEffect(() => {
    if (productId) loadComparison(productId);
  }, [productId]);

  const loadComparison = async (id: string) => {
    setLoading(true);
    try {
      const [prodRes, priceRes] = await Promise.all([
        productService.getById(id),
        priceService.compare(id),
      ]);
      setSelectedProduct(prodRes.data.data);
      setComparisons(priceRes.data.data?.comparisons || []);
      setSavings(priceRes.data.data?.savings || 0);
    } catch { /* error */ }
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    if (!query) { setProducts([]); return; }
    try {
      const res = await productService.search({ q: query, limit: 10 });
      setProducts(res.data.products || []);
    } catch { /* skip */ }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Price Comparison</h1>
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search a product to compare prices..."
      />

      {/* Search results */}
      {products.length > 0 && !selectedProduct && (
        <div className="space-y-2">
          {products.map((p) => (
            <Card
              key={p._id}
              hover
              onClick={() => { navigate(`/compare?product=${p._id}`); setProducts([]); }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-2xl">🛒</div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{p.productName}</p>
                <p className="text-xs text-gray-500">{typeof p.brandId === 'object' ? p.brandId.brandName : ''} • {p.unit}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison results */}
      {selectedProduct && (
        <>
          <Card className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-3xl">🛒</div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 dark:text-white">{selectedProduct.productName}</h2>
              <p className="text-sm text-gray-500">{typeof selectedProduct.brandId === 'object' ? selectedProduct.brandId.brandName : ''} • {selectedProduct.unit}</p>
            </div>
            {savings > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-500">You can save up to</p>
                <p className="text-2xl font-bold text-primary-500">RM {savings.toFixed(2)}</p>
              </div>
            )}
          </Card>

          {loading ? (
            <div className="text-center py-12"><div className="text-4xl animate-bounce">⏳</div></div>
          ) : comparisons.length === 0 ? (
            <Card><p className="text-center py-8 text-gray-500">No price data available for this product</p></Card>
          ) : (
            <div className="space-y-4">
              {comparisons.map((comp, i) => (
                <Card key={i} hover className={`relative ${comp.isLowestPrice ? 'ring-2 ring-primary-500' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-2xl font-bold text-primary-500">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{comp.store.storeName}</h3>
                          {comp.isLowestPrice && <span className="badge-lowest">🏆 Cheapest</span>}
                          {comp.isBestPromotion && <span className="badge-promo">⭐ Best Deal</span>}
                        </div>
                        <p className="text-sm text-gray-500">{comp.store.mallName}</p>
                        {comp.hasPromotion && comp.promotion && (
                          <p className="text-xs text-accent-500 mt-1">🎉 {comp.promotion.title} ({comp.promotion.discountPercentage}% off)</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {comp.hasPromotion && (
                        <p className="text-sm text-gray-400 line-through">RM {comp.currentPrice.toFixed(2)}</p>
                      )}
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        RM {comp.effectivePrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedProduct && !products.length && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Search a product to compare</h3>
          <p className="text-gray-500 dark:text-gray-400">Enter a product name above to see prices across all stores</p>
        </div>
      )}
    </div>
  );
}
