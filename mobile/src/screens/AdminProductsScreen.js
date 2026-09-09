import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, Switch, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { categoryService, brandService, productService, priceService, storeService } from '../services/dataService';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag', 'unit'];

export default function AdminProductsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [prices, setPrices] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = adding new
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState('');
  const [pickerData, setPickerData] = useState([]);

  // Form State
  const [formStoreId, setFormStoreId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBrandId, setFormBrandId] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formPrice, setFormPrice] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('active'); // Global product status

  // Expandable store sections
  const [expandedStores, setExpandedStores] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pricesRes, storesRes, catsRes, brandsRes] = await Promise.all([
        priceService.getAll({ limit: 500 }), // Get all for admin
        storeService.getAll(),
        categoryService.getAll(),
        brandService.getAll()
      ]);

      const fetchedPrices = pricesRes?.data?.prices || pricesRes?.prices || [];
      const fetchedStores = storesRes?.data?.data || storesRes?.data || [];
      
      setPrices(fetchedPrices);
      setStores(fetchedStores);
      setCategories(catsRes?.data?.data || catsRes?.data || []);
      setBrands(brandsRes?.data?.data || brandsRes?.data || []);

      // Initialize all stores as expanded
      const expandMap = {};
      fetchedStores.forEach(s => { expandMap[s._id] = true; });
      setExpandedStores(expandMap);

    } catch (error) {
      console.log('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const toggleStore = (storeId) => {
    setExpandedStores(prev => ({ ...prev, [storeId]: !prev[storeId] }));
  };

  const handleDelete = (priceId) => {
    Alert.alert('Delete Product Pricing', 'Are you sure you want to remove this product from this store?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await priceService.delete(priceId);
          setPrices(prev => prev.filter(p => p._id !== priceId));
        } catch(e) {
          Alert.alert('Error', 'Could not delete product');
        }
      }}
    ]);
  };

  // --- FORM LOGIC ---
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      // Edit Mode
      setFormStoreId(item.storeId?._id || '');
      setFormName(item.productId?.productName || '');
      setFormCategoryId(item.productId?.categoryId?._id || '');
      setFormBrandId(item.productId?.brandId?._id || '');
      setFormUnit(item.productId?.unit || 'pcs');
      setFormPrice(item.price ? item.price.toString() : '');
      setFormInStock(item.inStock !== false);
      setFormImage(item.productId?.image || '');
      setFormStatus(item.productId?.status || 'active');
    } else {
      // Add Mode
      setFormStoreId(stores[0]?._id || '');
      setFormName('');
      setFormCategoryId('');
      setFormBrandId('');
      setFormUnit('pcs');
      setFormPrice('');
      setFormInStock(true);
      setFormImage('');
      setFormStatus('active');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formStoreId || !formName || !formCategoryId || !formBrandId || !formPrice) {
      Alert.alert('Validation', 'Please fill in all required fields (Store, Name, Category, Brand, Price)');
      return;
    }

    try {
      setSubmitting(true);
      const parsedPrice = parseFloat(formPrice);

      if (editingItem) {
        // UPDATE FLOW
        // 1. Update Global Product
        await productService.update(editingItem.productId._id, {
          productName: formName,
          categoryId: formCategoryId,
          brandId: formBrandId,
          unit: formUnit,
          image: formImage,
          status: formStatus
        });
        // 2. Update Price record
        await priceService.update({
          productId: editingItem.productId._id,
          storeId: formStoreId,
          price: parsedPrice,
          inStock: formInStock
        });
        Alert.alert('Success', 'Product updated!');
      } else {
        // ADD FLOW
        // 1. Create Global Product
        const prodRes = await productService.create({
          productName: formName,
          categoryId: formCategoryId,
          brandId: formBrandId,
          unit: formUnit,
          image: formImage,
          status: formStatus
        });
        const newProdId = prodRes?.data?.data?._id || prodRes?.data?._id;
        
        // 2. Create Price record
        if (newProdId) {
          await priceService.update({
            productId: newProdId,
            storeId: formStoreId,
            price: parsedPrice,
            inStock: formInStock
          });
          Alert.alert('Success', 'Product added!');
        }
      }
      setModalVisible(false);
      fetchData(); // Refresh list
    } catch (e) {
      console.log('Save error:', e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // --- PICKERS ---
  const openPicker = (type) => {
    setPickerType(type);
    if (type === 'store') setPickerData(stores.map(s => ({ label: s.storeName, value: s._id })));
    else if (type === 'category') setPickerData(categories.map(c => ({ label: c.categoryName, value: c._id })));
    else if (type === 'brand') setPickerData(brands.map(b => ({ label: b.brandName, value: b._id })));
    else if (type === 'unit') setPickerData(UNITS.map(u => ({ label: u, value: u })));
    else if (type === 'status') setPickerData([{label:'Active', value:'active'}, {label:'Inactive', value:'inactive'}, {label:'Discontinued', value:'discontinued'}]);
    setPickerVisible(true);
  };

  const handleSelect = (val) => {
    if (pickerType === 'store') setFormStoreId(val);
    else if (pickerType === 'category') setFormCategoryId(val);
    else if (pickerType === 'brand') setFormBrandId(val);
    else if (pickerType === 'unit') setFormUnit(val);
    else if (pickerType === 'status') setFormStatus(val);
    setPickerVisible(false);
  };

  const getLabel = (type, val) => {
    if (!val) return `Select ${type}`;
    if (type === 'store') return stores.find(s => s._id === val)?.storeName || val;
    if (type === 'category') return categories.find(c => c._id === val)?.categoryName || val;
    if (type === 'brand') return brands.find(b => b._id === val)?.brandName || val;
    if (type === 'status') return val.charAt(0).toUpperCase() + val.slice(1);
    return val;
  };

  // --- DATA GROUPING ---
  const groupedData = useMemo(() => {
    // 1. Filter by search
    let filtered = prices;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = prices.filter(p => {
        const name = p.productId?.productName?.toLowerCase() || '';
        const brand = p.productId?.brandId?.brandName?.toLowerCase() || '';
        const store = p.storeId?.storeName?.toLowerCase() || '';
        return name.includes(q) || brand.includes(q) || store.includes(q);
      });
    }

    // 2. Group by Store -> Brand
    const group = {};
    filtered.forEach(p => {
      const sId = p.storeId?._id;
      if (!sId) return;
      if (!group[sId]) group[sId] = { store: p.storeId, brands: {}, count: 0 };
      
      const bId = p.productId?.brandId?._id || 'unknown';
      if (!group[sId].brands[bId]) group[sId].brands[bId] = { brand: p.productId?.brandId, items: [] };
      
      group[sId].brands[bId].items.push(p);
      group[sId].count += 1;
    });
    return Object.values(group);
  }, [prices, searchQuery]);

  if (loading && prices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Management</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, brand, or store..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LIST */}
        <ScrollView style={styles.listContainer}>
          {groupedData.length === 0 && !loading && (
             <Text style={styles.emptyText}>No products found.</Text>
          )}
          {groupedData.map(storeGroup => (
            <View key={storeGroup.store._id} style={styles.storeSection}>
              {/* Store Header */}
              <TouchableOpacity 
                style={styles.storeHeader} 
                onPress={() => toggleStore(storeGroup.store._id)}
              >
                <Text style={styles.storeTitle}>{storeGroup.store.storeName} ({storeGroup.count})</Text>
                <Ionicons 
                  name={expandedStores[storeGroup.store._id] ? 'chevron-up' : 'chevron-down'} 
                  size={20} color={colors.white} 
                />
              </TouchableOpacity>

              {/* Store Items (Grouped by Brand) */}
              {expandedStores[storeGroup.store._id] && Object.values(storeGroup.brands).map(brandGroup => (
                <View key={brandGroup.brand?._id || 'unknown'}>
                  <Text style={styles.brandTitle}>{brandGroup.brand?.brandName || 'No Brand'}</Text>
                  
                  {brandGroup.items.map(item => {
                    const renderRightActions = (progress, dragX) => {
                      const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
                      return (
                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
                          <Animated.View style={{ transform: [{ scale: trans }] }}>
                            <Ionicons name="trash" size={24} color={colors.white} />
                          </Animated.View>
                        </TouchableOpacity>
                      );
                    };

                    return (
                      <Swipeable key={item._id} renderRightActions={renderRightActions} overshootRight={false}>
                        <View style={styles.productRow}>
                          <View style={styles.imagePlaceholder}>
                            {item.productId?.image ? (
                              <Text style={styles.imgText}>IMG</Text> // Using text placeholder if URL fails
                            ) : (
                              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                            )}
                          </View>
                          <View style={styles.productDetails}>
                            <Text style={styles.productName}>{item.productId?.productName}</Text>
                            <Text style={styles.productCategory}>{item.productId?.categoryId?.categoryName || 'Uncategorized'}</Text>
                            <View style={styles.priceRow}>
                              <Text style={styles.productPrice}>RM{item.price.toFixed(2)}</Text>
                              <View style={[styles.stockBadge, { backgroundColor: item.inStock !== false ? colors.primaryLight : '#FFEbee' }]}>
                                <Text style={[styles.stockText, { color: item.inStock !== false ? colors.primary : colors.discount }]}>
                                  {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
                            <Ionicons name="pencil" size={20} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </Swipeable>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => openModal(null)}>
          <Ionicons name="add" size={30} color={colors.white} />
        </TouchableOpacity>

        {/* Edit/Add Modal */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Product' : 'Add New Product'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.modalSave}>Save</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              
              <Text style={styles.label}>Store * (Price Assignment)</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('store')}>
                <Text style={styles.pickerText}>{getLabel('store', formStoreId)}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Product Name *</Text>
              <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="e.g. Milo 1kg" />

              <Text style={styles.label}>Brand *</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('brand')}>
                <Text style={styles.pickerText}>{getLabel('brand', formBrandId)}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('category')}>
                <Text style={styles.pickerText}>{getLabel('category', formCategoryId)}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price (RM) *</Text>
                  <TextInput style={styles.input} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unit *</Text>
                  <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('unit')}>
                    <Text style={styles.pickerText}>{formUnit}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Stock Status</Text>
              <View style={styles.switchRow}>
                <Text style={styles.pickerText}>{formInStock ? 'In Stock' : 'Out of Stock'}</Text>
                <Switch value={formInStock} onValueChange={setFormInStock} trackColor={{ true: colors.primary }} />
              </View>

              <Text style={styles.label}>Global Product Status</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('status')}>
                <Text style={styles.pickerText}>{getLabel('status', formStatus)}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Image URL (Optional)</Text>
              <TextInput style={styles.input} value={formImage} onChangeText={setFormImage} placeholder="https://..." autoCapitalize="none" />
              <Text style={styles.helpText}>Due to app constraints, please use a public URL. Placeholders will show if left empty.</Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Dropdown Modal */}
        <Modal visible={pickerVisible} transparent animationType="fade">
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownContent}>
              <FlatList
                data={pickerData}
                keyExtractor={(item) => item.value}
                renderItem={({item}) => (
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelect(item.value)}>
                    <Text style={styles.dropdownItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.dropdownCancel} onPress={() => setPickerVisible(false)}>
                <Text style={{color: colors.discount, fontWeight: '600'}}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  headerTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  searchContainer: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 40 },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.sm },
  listContainer: { flex: 1, backgroundColor: colors.surface },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  
  storeSection: { marginBottom: spacing.md, backgroundColor: colors.white },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: '#388E3C' },
  storeTitle: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  brandTitle: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  
  productRow: { flexDirection: 'row', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  imagePlaceholder: { width: 50, height: 50, backgroundColor: colors.surface, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  imgText: { fontSize: 10, color: colors.textMuted },
  productDetails: { flex: 1 },
  productName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  productCategory: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.md },
  productPrice: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  stockBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  stockText: { fontSize: 10, fontWeight: '600' },
  editBtn: { padding: spacing.sm },
  deleteButton: { backgroundColor: colors.discount, width: 80, justifyContent: 'center', alignItems: 'center' },

  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 } },
  
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  modalCancel: { color: colors.textSecondary, fontSize: fontSize.md },
  modalTitle: { fontSize: fontSize.md, fontWeight: '700' },
  modalSave: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  modalForm: { padding: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.md },
  pickerField: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  pickerText: { fontSize: fontSize.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  helpText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },

  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  dropdownContent: { backgroundColor: colors.white, borderRadius: radius.md, maxHeight: '60%' },
  dropdownItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownItemText: { fontSize: fontSize.md },
  dropdownCancel: { padding: spacing.md, alignItems: 'center' }
});
