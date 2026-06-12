import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Trash2, Minus, Store } from 'lucide-react';
import { shoppingListService, productService } from '../services/dataService';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import type { ShoppingList as ShoppingListType, Product } from '../types';
import toast from 'react-hot-toast';

export default function ShoppingList() {
  const [lists, setLists] = useState<ShoppingListType[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingListType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [storeComparison, setStoreComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const res = await shoppingListService.getAll();
      setLists(res.data.data || []);
    } catch { /* skip */ }
    setLoading(false);
  };

  const createList = async () => {
    if (!newListTitle.trim()) return;
    try {
      await shoppingListService.create(newListTitle);
      toast.success('Shopping list created!');
      setNewListTitle('');
      setShowCreateModal(false);
      loadLists();
    } catch { toast.error('Failed to create list'); }
  };

  const selectList = async (list: ShoppingListType) => {
    try {
      const res = await shoppingListService.getById(list._id);
      setSelectedList(res.data.data);
      // Load store comparison
      try {
        const compRes = await shoppingListService.compareStores(list._id);
        setStoreComparison(compRes.data.data);
      } catch { /* skip */ }
    } catch { toast.error('Failed to load list'); }
  };

  const handleSearchProducts = async (query: string) => {
    if (!query) { setSearchResults([]); return; }
    try {
      const res = await productService.search({ q: query, limit: 5 });
      setSearchResults(res.data.products || []);
    } catch { /* skip */ }
  };

  const addItem = async (productId: string) => {
    if (!selectedList) return;
    try {
      await shoppingListService.addItem(selectedList._id, productId, 1);
      toast.success('Item added!');
      setShowAddItemModal(false);
      setSearchResults([]);
      selectList(selectedList);
    } catch { toast.error('Failed to add item'); }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!selectedList || quantity < 1) return;
    try {
      await shoppingListService.updateItem(selectedList._id, itemId, quantity);
      selectList(selectedList);
    } catch { toast.error('Failed to update'); }
  };

  const removeItem = async (itemId: string) => {
    if (!selectedList) return;
    try {
      await shoppingListService.removeItem(selectedList._id, itemId);
      toast.success('Item removed');
      selectList(selectedList);
    } catch { toast.error('Failed to remove'); }
  };

  const deleteList = async (listId: string) => {
    try {
      await shoppingListService.delete(listId);
      toast.success('List deleted');
      setSelectedList(null);
      loadLists();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" /> New List
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lists Panel */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Your Lists</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>
          ) : lists.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-500 text-sm">No shopping lists yet</p>
            </Card>
          ) : (
            lists.map((list) => (
              <Card
                key={list._id}
                hover
                onClick={() => selectList(list)}
                className={`cursor-pointer ${selectedList?._id === list._id ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{list.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      RM {list.totalPrice?.toFixed(2) || '0.00'} • Save RM {list.estimatedSaving?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteList(list._id); }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Selected List Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedList ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedList.title}</h2>
                <Button size="sm" variant="secondary" onClick={() => setShowAddItemModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>

              {/* Items */}
              {selectedList.items && selectedList.items.length > 0 ? (
                <div className="space-y-3">
                  {selectedList.items.map((item: any) => {
                    const product = typeof item.productId === 'object' ? item.productId : null;
                    return (
                      <Card key={item._id} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xl">🛒</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {product?.productName || 'Product'}
                          </p>
                          <p className="text-xs text-gray-500">{product?.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <p className="text-gray-500 text-sm">No items in this list. Add some products!</p>
                </Card>
              )}

              {/* Store Comparison */}
              {storeComparison && storeComparison.storeTotals?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <Store className="w-4 h-4" /> Store Comparison
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {storeComparison.storeTotals
                      .filter((s: any) => s.total > 0)
                      .sort((a: any, b: any) => a.total - b.total)
                      .map((store: any, i: number) => (
                        <Card
                          key={i}
                          className={`${i === 0 ? 'ring-2 ring-primary-500' : ''}`}
                        >
                          {i === 0 && <span className="badge-lowest mb-2 inline-block">🏆 Cheapest</span>}
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{store.store.storeName}</h4>
                          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                            RM {store.total.toFixed(2)}
                          </p>
                        </Card>
                      ))}
                  </div>
                  {storeComparison.estimatedSaving > 0 && (
                    <Card className="mt-3 bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
                      <p className="text-sm text-primary-700 dark:text-primary-300">
                        💰 By choosing the cheapest store, you save <strong>RM {storeComparison.estimatedSaving.toFixed(2)}</strong>!
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a shopping list</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a list from the left panel or create a new one</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Shopping List">
        <div className="space-y-4">
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="e.g., Weekly Groceries"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            onKeyDown={(e) => e.key === 'Enter' && createList()}
          />
          <Button onClick={createList} className="w-full">Create List</Button>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={showAddItemModal} onClose={() => { setShowAddItemModal(false); setSearchResults([]); }} title="Add Product to List">
        <div className="space-y-4">
          <SearchBar onSearch={handleSearchProducts} placeholder="Search products..." />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <Card
                key={product._id}
                hover
                onClick={() => addItem(product._id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-lg">🛒</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{product.productName}</p>
                  <p className="text-xs text-gray-500">{typeof product.brandId === 'object' ? product.brandId.brandName : ''}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
