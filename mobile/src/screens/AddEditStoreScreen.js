import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { storeService, uploadService } from '../services/dataService';
import { locationService } from '../services/locationService';
import { colors, fontSize, spacing, radius, commonStyles } from '../theme/theme';

const STORE_TYPES = ['hypermarket', 'supermarket', 'minimart', 'convenience store'];

export default function AddEditStoreScreen({ route, navigation }) {
  const { store, state } = route.params || {};
  const isEditing = !!store;

  const existingCoords =
    store?.location?.coordinates && store.location.coordinates.length === 2
      ? { latitude: store.location.coordinates[1], longitude: store.location.coordinates[0] }
      : null;

  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(existingCoords); // { latitude, longitude } | null
  const [formData, setFormData] = useState({
    storeName: store?.storeName || '',
    branch: store?.branch || '',
    type: store?.type || 'supermarket',
    address: store?.address || '',
    city: store?.city || '',
    state: store?.state || state || '',
    operating_hours: store?.operating_hours || '',
    logo: store?.logo || '',
    isActive: store ? store.isActive : true,
  });

  const MAP_FALLBACK = existingCoords || { latitude: 1.8548, longitude: 102.9358 };

  const useCurrentForStore = async () => {
    try {
      const pos = await locationService.getCurrentPosition();
      setCoords({ latitude: pos.lat, longitude: pos.lng });
    } catch (e) {
      Alert.alert('Location', e?.message || 'Could not get current location.');
    }
  };

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.storeName || formData.storeName.length < 3) newErrors.storeName = 'Store Name must be at least 3 characters.';
    if (!formData.city) newErrors.city = 'City is required.';
    if (!formData.state) newErrors.state = 'State is required.';
    if (!formData.address) newErrors.address = 'Address is required.';
    if (!formData.type) newErrors.type = 'Store Type is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission needed', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const uploadRes = await uploadService.uploadImage(result.assets[0].uri);
        const imageUrl = uploadRes.data?.data?.url || uploadRes.data?.url || uploadRes.url || uploadRes.data;
        if (typeof imageUrl === 'string') {
          setFormData(prev => ({ ...prev, logo: imageUrl }));
        } else {
           // fallback if response structure is different
           Alert.alert('Upload Error', 'Could not get image URL from response');
        }
      } catch (e) {
        Alert.alert('Upload Error', 'Failed to upload image.');
        console.log(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...formData };
      if (coords) {
        payload.location = {
          type: 'Point',
          coordinates: [coords.longitude, coords.latitude],
        };
      }
      if (isEditing) {
        await storeService.update(store._id, payload);
        Alert.alert('Success', 'Store updated successfully');
      } else {
        await storeService.create(payload);
        Alert.alert('Success', 'Store created successfully');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save store');
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete ${formData.storeName}? This will also remove all associated products.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await storeService.delete(store._id);
              Alert.alert('Deleted', 'Store deleted successfully');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete store');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={loading}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Supermarket' : 'Add Supermarket'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={loading} style={styles.logoContainer}>
            {formData.logo ? (
              <Image source={{ uri: formData.logo }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                <Text style={styles.logoText}>Upload Logo</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name *</Text>
          <TextInput
            style={[styles.input, errors.storeName && styles.inputError]}
            value={formData.storeName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, storeName: text }))}
            placeholder="e.g. Lotus's Batu Pahat"
            editable={!loading}
          />
          {errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Branch Name</Text>
          <TextInput
            style={styles.input}
            value={formData.branch}
            onChangeText={(text) => setFormData(prev => ({ ...prev, branch: text }))}
            placeholder="e.g. Main Branch"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Type *</Text>
          <View style={styles.typeContainer}>
            {STORE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, formData.type === type && styles.typeChipActive]}
                onPress={() => setFormData(prev => ({ ...prev, type }))}
                disabled={loading}
              >
                <Text style={[styles.typeChipText, formData.type === type && styles.typeChipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError, { height: 80, textAlignVertical: 'top' }]}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            placeholder="Full Address"
            multiline
            editable={!loading}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="e.g. Batu Pahat"
              editable={!loading}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={[styles.input, errors.state && styles.inputError]}
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
              placeholder="e.g. Johor"
              editable={!loading}
            />
            {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Operating Hours</Text>
          <TextInput
            style={styles.input}
            value={formData.operating_hours}
            onChangeText={(text) => setFormData(prev => ({ ...prev, operating_hours: text }))}
            placeholder="e.g. 8:00 AM - 10:00 PM"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>Store Location (map pin)</Text>
            <TouchableOpacity onPress={useCurrentForStore} disabled={loading}>
              <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' }}>
                Use current
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Tap the map to place the store. Used for distance comparison.
          </Text>
          <View style={styles.mapBox}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                ...MAP_FALLBACK,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={(e) => setCoords(e.nativeEvent.coordinate)}
            >
              {coords && <Marker coordinate={coords} />}
            </MapView>
          </View>
          {coords && (
            <Text style={styles.coordText}>
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Text>
          )}
        </View>

        <View style={styles.switchGroup}>
          <View>
            <Text style={styles.label}>Is Active</Text>
            <Text style={styles.helperText}>Inactive stores are hidden from users</Text>
          </View>
          <Switch
            value={formData.isActive}
            onValueChange={(val) => setFormData(prev => ({ ...prev, isActive: val }))}
            disabled={loading}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={formData.isActive ? colors.primary : colors.textSecondary}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity 
          style={[commonStyles.primaryButton, { marginTop: spacing.xl }, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={commonStyles.primaryButtonText}>Save Store</Text>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color={colors.discount} />
            <Text style={styles.deleteButtonText}>Delete Store</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  
  logoSection: { alignItems: 'center', marginBottom: spacing.xl },
  logoContainer: {
    width: 100, height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative'
  },
  logoPlaceholder: { alignItems: 'center' },
  logoImage: { width: 98, height: 98, borderRadius: radius.md, resizeMode: 'contain' },
  logoText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  editBadge: {
    position: 'absolute', right: -10, bottom: -10,
    backgroundColor: colors.primary,
    width: 28, height: 28,
    borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.white
  },

  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  helperText: { fontSize: fontSize.xs, color: colors.textMuted },
  input: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.discount },
  errorText: { fontSize: fontSize.xs, color: colors.discount, marginTop: 4 },
  mapBox: {
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  coordText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 44, justifyContent: 'center'
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  typeChipTextActive: { color: colors.white, fontWeight: '600' },

  switchGroup: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border
  },

  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm,
    minHeight: 48
  },
  deleteButtonText: { color: colors.discount, fontSize: fontSize.md, fontWeight: '600' }
});
