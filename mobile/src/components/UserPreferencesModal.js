import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { storeService, authService } from '../services/dataService';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const MALAYSIA_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
  'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 
  'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 
  'W.P. Labuan', 'W.P. Putrajaya'
];

export default function UserPreferencesModal({ visible, onClose, onSaveSuccess }) {
  const { user, login } = useAuth(); // We might need to refresh user data if authContext allows it, or just call onSaveSuccess to trigger reload
  
  const [step, setStep] = useState(1); // 1 = State, 2 = Stores
  const [selectedState, setSelectedState] = useState('');
  const [selectedStores, setSelectedStores] = useState([]);
  
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      if (user.preferredState) {
        setSelectedState(user.preferredState);
        setSelectedStores(user.preferredStores || []);
      }
      setStep(1);
    }
  }, [visible, user]);

  const fetchStoresForState = async (state) => {
    try {
      setLoadingStores(true);
      const res = await storeService.getAll({ state });
      const storesData = res?.data?.data || res?.data || [];
      setStores(storesData);
    } catch (e) {
      console.log('Error fetching stores:', e);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedStores([]); // reset stores when state changes
    fetchStoresForState(state);
    setStep(2);
  };

  const toggleStore = (storeId) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter(id => id !== storeId));
    } else {
      setSelectedStores([...selectedStores, storeId]);
    }
  };

  const handleSave = async () => {
    if (!selectedState || selectedStores.length === 0) return;
    
    try {
      setSaving(true);
      await authService.updateProfile({
        preferredState: selectedState,
        preferredStores: selectedStores
      });
      // Optionally we should update the auth context user data
      onSaveSuccess(selectedState, selectedStores);
    } catch (e) {
      console.log('Error saving preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            {step === 2 && (
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>
              {step === 1 ? 'Select Your State' : 'Select Preferred Stores'}
            </Text>
            {step === 1 && <View style={styles.backBtn} />}
            {step === 2 && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          {step === 1 ? (
            <ScrollView style={styles.scroll}>
              <Text style={styles.subtitle}>Where do you usually shop?</Text>
              {MALAYSIA_STATES.map(state => (
                <TouchableOpacity 
                  key={state}
                  style={[styles.listItem, selectedState === state && styles.listItemSelected]}
                  onPress={() => handleStateSelect(state)}
                >
                  <Text style={[styles.listText, selectedState === state && styles.listTextSelected]}>
                    {state}
                  </Text>
                  {selectedState === state && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.storesContainer}>
              <Text style={styles.subtitle}>Select the stores in {selectedState} you visit most often.</Text>
              
              {loadingStores ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
              ) : stores.length === 0 ? (
                <Text style={styles.emptyText}>No stores found in {selectedState}. Try another state.</Text>
              ) : (
                <ScrollView style={styles.scroll}>
                  {stores.map(store => {
                    const isSelected = selectedStores.includes(store._id);
                    return (
                      <TouchableOpacity 
                        key={store._id}
                        style={[styles.storeCard, isSelected && styles.storeCardSelected]}
                        onPress={() => toggleStore(store._id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.storeName, isSelected && styles.storeNameSelected]}>
                            {store.storeName}
                          </Text>
                          <Text style={styles.storeLocation}>{store.mallName || store.city}</Text>
                        </View>
                        <Ionicons 
                          name={isSelected ? "checkbox" : "square-outline"} 
                          size={24} 
                          color={isSelected ? colors.primary : colors.textMuted} 
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={[commonStyles.primaryButton, selectedStores.length === 0 && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={selectedStores.length === 0 || saving}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={commonStyles.primaryButtonText}>Save Preferences</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: '85%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  backBtn: { width: 40 },
  closeBtn: { width: 40, alignItems: 'flex-end' },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemSelected: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderBottomWidth: 0,
    marginBottom: 1,
  },
  listText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  listTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  storesContainer: {
    flex: 1,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  storeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  storeNameSelected: {
    color: colors.primary,
  },
  storeLocation: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  disabledButton: {
    backgroundColor: colors.textMuted,
  }
});
