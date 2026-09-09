import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, Switch, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { categoryService, brandService, productService, priceService, uploadService } from '../services/dataService';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import API_URL from '../constants';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag', 'unit'];

export default function AdminProductListScreen({ route, navigation }) {
  const { storeId, storeName } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [prices, setPrices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState('');
  const [pickerData, setPickerData] = useState([]);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBrandId, setFormBrandId] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formPrice, setFormPrice] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('active');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch prices but specifically filter by storeId
      const [pricesRes, catsRes, brandsRes] = await Promise.all([
        priceService.getAll({ limit: 1000, storeId }), 
        categoryService.getAll(),
        brandService.getAll()
      ]);

      const fetchedPrices = pricesRes?.data?.prices || pricesRes?.prices || [];
      // Filter strictly client side as well just in case backend ignores storeId in query
      const storePrices = fetchedPrices.filter(p => p.storeId?._id === storeId);
      
      setPrices(storePrices);
      setCategories(catsRes?.data?.data || catsRes?.data || []);
      setBrands(brandsRes?.data?.data || brandsRes?.data || []);

    } catch (error) {
      console.log('Error fetching store products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [storeId])
  );

  const handleDelete = (priceId) => {
    Alert.alert('Delete Product Pricing', 'Remove this product from this store?', [
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

  // --- IMAGE PICKER ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      try {
        setSubmitting(true);
        const res = await uploadService.uploadImage(uri);
        if (res?.data?.url) {
          setFormImage(`${API_URL}${res.data.url}`);
        }
      } catch(e) {
        console.log("Upload error:", e);
        Alert.alert('Upload Failed', 'Could not upload image to server.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // --- FORM LOGIC ---
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormName(item.productId?.productName || '');
      setFormCategoryId(item.productId?.categoryId?._id || '');
      setFormBrandId(item.productId?.brandId?._id || '');
      setFormUnit(item.productId?.unit || 'pcs');
      setFormPrice(item.price ? item.price.toString() : '');
      setFormInStock(item.inStock !== false);
      setFormImage(item.productId?.image || '');
      setFormStatus(item.productId?.status || 'active');
    } else {
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
    if (!formName || !formCategoryId || !formBrandId || !formPrice) {
      Alert.alert('Validation', 'Please fill in Name, Category, Brand, and Price');
      return;
    }

    try {
      setSubmitting(true);
      const parsedPrice = parseFloat(formPrice);

      if (editingItem) {
        await productService.update(editingItem.productId._id, {
          productName: formName,
          categoryId: formCategoryId,
          brandId: formBrandId,
          unit: formUnit,
          image: formImage,
          status: formStatus
        });
        await priceService.update({
          productId: editingItem.productId._id,
          storeId: storeId, // FIXED TO CURRENT STORE
          price: parsedPrice,
          inStock: formInStock
        });
        Alert.alert('Success', 'Product updated!');
      } else {
        const prodRes = await productService.create({
          productName: formName,
          categoryId: formCategoryId,
          brandId: formBrandId,
          unit: formUnit,
          image: formImage,
          status: formStatus
        });
        const newProdId = prodRes?.data?.data?._id || prodRes?.data?._id;
        
        if (newProdId) {
          await priceService.update({
            productId: newProdId,
            storeId: storeId,
            price: parsedPrice,
            inStock: formInStock
          });
          Alert.alert('Success', 'Product added!');
        }
      }
      setModalVisible(false);
      fetchData();
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
    if (type === 'category') setPickerData(categories.map(c => ({ label: c.categoryName, value: c._id })));
    else if (type === 'brand') setPickerData(brands.map(b => ({ label: b.brandName, value: b._id })));
    else if (type === 'unit') setPickerData(UNITS.map(u => ({ label: u, value: u })));
    else if (type === 'status') setPickerData([{label:'Active', value:'active'}, {label:'Inactive', value:'inactive'}, {label:'Discontinued', value:'discontinued'}]);
    setPickerVisible(true);
  };

  const handleSelect = (val) => {
    if (pickerType === 'category') setFormCategoryId(val);
    else if (pickerType === 'brand') setFormBrandId(val);
    else if (pickerType === 'unit') setFormUnit(val);
    else if (pickerType === 'status') setFormStatus(val);
    setPickerVisible(false);
  };

  const getLabel = (type, val) => {
    if (!val) return `Select ${type}`;
    if (type === 'category') return categories.find(c => c._id === val)?.categoryName || val;
    if (type === 'brand') return brands.find(b => b._id === val)?.brandName || val;
    if (type === 'status') return val.charAt(0).toUpperCase() + val.slice(1);
    return val;
  };

  // --- DATA GROUPING ---
  const groupedData = useMemo(() => {
    let filtered = prices;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = prices.filter(p => {
        const name = p.productId?.productName?.toLowerCase() || '';
        const brand = p.productId?.brandId?.brandName?.toLowerCase() || '';
        return name.includes(q) || brand.includes(q);
      });
    }

    // Group by Brand
    const group = {};
    filtered.forEach(p => {
      const bId = p.productId?.brandId?._id || 'unknown';
      if (!group[bId]) group[bId] = { brand: p.productId?.brandId, items: [] };
      group[bId].items.push(p);
    });
    return Object.values(group).sort((a,b) => (a.brand?.brandName || '').localeCompare(b.brand?.brandName || ''));
  }, [prices, searchQuery]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{storeName}</Text>
          <TouchableOpacity onPress={() => fetchData()} style={{ padding: spacing.xs }}>
            <Ionicons name="refresh" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products or brands..."
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
          {loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{marginTop: spacing.xl}} />
          ) : groupedData.length === 0 ? (
             <Text style={styles.emptyText}>No products found.</Text>
          ) : (
            groupedData.map(brandGroup => (
              <View key={brandGroup.brand?._id || 'unknown'} style={styles.brandSection}>
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
                            <Image source={{ uri: item.productId.image.startsWith('http') ? item.productId.image : `${API_URL}${item.productId.image}` }} style={styles.productImage} />
                          ) : (
                            <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                          )}
                        </View>
                        <View style={styles.productDetails}>
                          <Text style={styles.productName} numberOfLines={2}>{item.productId?.productName}</Text>
                          <Text style={styles.productCategory} numberOfLines={1}>{item.productId?.categoryId?.categoryName || 'Uncategorized'}</Text>
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
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => openModal(null)}>
          <Ionicons name="add" size={30} color={colors.white} />
        </TouchableOpacity>

        {/* Edit/Add Modal */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Product' : 'Add New Product'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.modalSave}>Save</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>

              {/* Image Uploader */}
              <View style={styles.imageUploadSection}>
                <View style={styles.imagePreviewWrap}>
                  {formImage ? (
                    <Image source={{ uri: formImage }} style={styles.imagePreview} />
                  ) : (
                    <Ionicons name="image" size={40} color={colors.textMuted} />
                  )}
                </View>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                  <Text style={styles.uploadBtnText}>Upload Image</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Product Name *</Text>
              <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="e.g. Milo 1kg" minHeight={48} />

              <Text style={styles.label}>Brand *</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('brand')}>
                <Text style={styles.pickerText} numberOfLines={1}>{getLabel('brand', formBrandId)}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('category')}>
                <Text style={styles.pickerText} numberOfLines={1}>{getLabel('category', formCategoryId)}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price (RM) *</Text>
                  <TextInput style={styles.input} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" placeholder="0.00" minHeight={48} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unit *</Text>
                  <TouchableOpacity style={styles.pickerField} onPress={() => openPicker('unit')}>
                    <Text style={styles.pickerText} numberOfLines={1}>{formUnit}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { flex: 1, color: colors.white, fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center', paddingHorizontal: spacing.sm },
  searchContainer: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 48 },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.md },
  listContainer: { flex: 1, backgroundColor: colors.surface },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  
  brandSection: { marginBottom: spacing.md, backgroundColor: colors.white },
  brandTitle: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  
  productRow: { flexDirection: 'row', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center', backgroundColor: colors.white, minHeight: 72 },
  imagePlaceholder: { width: 50, height: 50, backgroundColor: colors.surface, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productDetails: { flex: 1 },
  productName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  productCategory: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.md },
  productPrice: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  stockBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  stockText: { fontSize: 10, fontWeight: '600' },
  editBtn: { padding: spacing.sm, minHeight: 44, justifyContent: 'center' },
  deleteButton: { backgroundColor: colors.discount, width: 80, justifyContent: 'center', alignItems: 'center', height: '100%' },

  fab: { position: 'absolute', bottom: spacing.xxl, right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 } },
  
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  modalCancel: { color: colors.textSecondary, fontSize: fontSize.md },
  modalTitle: { fontSize: fontSize.md, fontWeight: '700' },
  modalSave: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  modalForm: { padding: spacing.lg },
  
  imageUploadSection: { alignItems: 'center', marginVertical: spacing.md },
  imagePreviewWrap: { width: 100, height: 100, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: spacing.sm },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.xs },
  uploadBtnText: { color: colors.primary, fontWeight: '600' },

  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: fontSize.md },
  pickerField: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 48, justifyContent: 'center' },
  pickerText: { fontSize: fontSize.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: spacing.md, minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },

  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  dropdownContent: { backgroundColor: colors.white, borderRadius: radius.md, maxHeight: '60%' },
  dropdownItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 48, justifyContent: 'center' },
  dropdownItemText: { fontSize: fontSize.md },
  dropdownCancel: { padding: spacing.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' }
});
