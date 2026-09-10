// Shared domain constants for BijakBeli v2 (multi-category marketplace)

// Top-level store categories shown on the home grid.
// `slug` is stored on Store.storeCategory and Product.storeCategory.
const STORE_CATEGORIES = [
  { slug: 'grocery', label: 'Grocery', icon: 'basket-outline' },
  { slug: 'automotive', label: 'Automotive', icon: 'car-outline' },
  { slug: 'hardware', label: 'Hardware', icon: 'hammer-outline' },
  { slug: 'electrical', label: 'Electrical', icon: 'bulb-outline' },
  { slug: 'home', label: 'Home & Living', icon: 'home-outline' },
  { slug: 'health', label: 'Health & Pharmacy', icon: 'medkit-outline' },
  { slug: 'telco', label: 'Telco & Computer', icon: 'laptop-outline' },
  { slug: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const STORE_CATEGORY_SLUGS = STORE_CATEGORIES.map((c) => c.slug);

const STORE_KINDS = ['chain', 'merchant'];

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'packing',
  'ready',
  'on_the_way',
  'completed',
  'cancelled',
];

module.exports = {
  STORE_CATEGORIES,
  STORE_CATEGORY_SLUGS,
  STORE_KINDS,
  ORDER_STATUSES,
};
