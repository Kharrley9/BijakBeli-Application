import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { categoryService, brandService, productService } from '../services/dataService';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag', 'unit'];

export default function AddProductScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [barcode, setBarcode] = useState('');
  const [image, setImage] = useState('');

  // Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData] = useState([]);
  const [pickerType, setPickerType] = useState(''); // 'category', 'brand', 'unit'

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      const [catRes, brandRes] = await Promise.all([
        categoryService.getAll(),
        brandService.getAll()
      ]);
      setCategories(catRes?.data?.data || catRes?.data || []);
      setBrands(brandRes?.data?.data || brandRes?.data || []);
    } catch (error) {
      console.log('Error fetching categories/brands:', error);
      Alert.alert('Error', 'Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const openPicker = (type) => {
    setPickerType(type);
    if (type === 'category') {
      setPickerData(categories.map(c => ({ label: c.categoryName, value: c._id })));
    } else if (type === 'brand') {
      setPickerData(brands.map(b => ({ label: b.brandName, value: b._id })));
    } else if (type === 'unit') {
      setPickerData(UNITS.map(u => ({ label: u, value: u })));
    }
    setPickerVisible(true);
  };

  const handleSelect = (value) => {
    if (pickerType === 'category') setCategoryId(value);
    if (pickerType === 'brand') setBrandId(value);
    if (pickerType === 'unit') setUnit(value);
    setPickerVisible(false);
  };

  const getLabelForId = (id, type) => {
    if (!id) return `Select ${type}`;
    if (type === 'category') return categories.find(c => c._id === id)?.categoryName || id;
    if (type === 'brand') return brands.find(b => b._id === id)?.brandName || id;
    if (type === 'unit') return id;
    return id;
  };

  const handleSubmit = async () => {
    if (!productName || !categoryId || !brandId || !unit) {
      Alert.alert('Validation Error', 'Please fill in all required fields: Name, Category, Brand, Unit.');
      return;
    }

    try {
      setSubmitting(true);
      const newProduct = {
        productName,
        description,
        categoryId,
        brandId,
        unit,
        barcode,
        image
      };
      
      const res = await productService.create(newProduct);
      if (res?.data?.success || res?.success) {
        Alert.alert('Success', 'Product added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add product.');
      }
    } catch (error) {
      console.log('Error adding product:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product. Make sure barcode is unique if provided.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product (Admin)</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Maggi Kari 5x79g"
            value={productName}
            onChangeText={setProductName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Product details..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('category')}>
            <Text style={[styles.pickerText, !categoryId && styles.placeholderText]}>
              {getLabelForId(categoryId, 'category')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.label}>Brand *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('brand')}>
            <Text style={[styles.pickerText, !brandId && styles.placeholderText]}>
              {getLabelForId(brandId, 'brand')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.label}>Unit *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('unit')}>
            <Text style={styles.pickerText}>{getLabelForId(unit, 'unit')}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.label}>Barcode</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9555022300010"
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={image}
            onChangeText={setImage}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.submitBtn]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={commonStyles.primaryButtonText}>Add Product</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {pickerType}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerData}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  scroll: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    flexGrow: 1,
  },
  formCard: {
    ...commonStyles.card,
    padding: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  pickerText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  modalItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
