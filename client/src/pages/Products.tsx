import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { productService, categoryService, brandService, priceService } from '../services/dataService';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import type { Product, Category, Brand } from '../types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [prices, setPrices] = useState<Record<string, { min: number; max: number }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('q') || '';

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (searchQuery) params.q = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedBrand) params.brandId = selectedBrand;

      const res = searchQuery
        ? await productService.search(params)
        : await productService.getAll(params);
      const fetchedProducts = res.data.products || [];
      setProducts(fetchedProducts);

      // Fetch price ranges
      const priceMap: Record<string, { min: number; max: number }> = {};
      for (const p of fetchedProducts.slice(0, 20)) {
        try {
          const priceRes = await priceService.compare(p._id);
          const comps = priceRes.data.data?.comparisons || [];
          if (comps.length) {
            priceMap[p._id] = {
              min: Math.min(...comps.map((c: any) => c.effectivePrice)),
              max: Math.max(...comps.map((c: any) => c.effectivePrice)),
            };
          }
        } catch { /* skip */ }
      }
      setPrices(priceMap);
    } catch { /* error */ }
    setLoading(false);
  }, [searchQuery, selectedCategory, selectedBrand]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([categoryService.getAll(), brandService.getAll()]);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
      } catch { /* skip */ }
    };
    loadFilters();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <SearchBar
          onSearch={(q) => navigate(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`)}
          className="w-full md:w-96"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-5 h-5 text-gray-400" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
        </select>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">All Brands</option>
          {brands.map((b) => <option key={b._id} value={b._id}>{b.brandName}</option>)}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="h-48 shimmer" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 shimmer rounded" />
                <div className="h-4 w-full shimmer rounded" />
                <div className="h-6 w-24 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              priceRange={prices[product._id]}
              onCompare={(id) => navigate(`/compare?product=${id}`)}
              onClick={() => navigate(`/products/${product._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
