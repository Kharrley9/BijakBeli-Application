import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { priceAlertService } from '../services/dataService';
import { PriceAlert } from '../types';

export default function PriceAlertsScreen({ navigation }: any) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res: any = await priceAlertService.listMine();
      setAlerts(res.data || []);
    } catch {
      /* keep */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (productId: string) => {
    Alert.alert('Remove alert', 'Stop watching this price?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await priceAlertService.remove(productId);
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not remove alert');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Price Alerts" />
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a._id}
          contentContainerStyle={alerts.length ? styles.list : styles.emptyWrap}
          renderItem={({ item }) => {
            const product = typeof item.productId === 'object' ? item.productId : null;
            const pid = typeof item.productId === 'object' ? item.productId._id : item.productId;
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => product && navigation.navigate('ProductDetail', { id: pid })}
              >
                <View style={styles.thumb}>
                  {product?.image ? (
                    <Image source={{ uri: product.image }} style={{ width: 44, height: 44 }} />
                  ) : (
                    <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>{product?.productName || 'Product'}</Text>
                  <Text style={styles.target}>
                    {item.active
                      ? `Alert when ≤ RM${item.targetPrice.toFixed(2)}`
                      : `Triggered at RM${item.triggeredPrice?.toFixed(2)}`}
                  </Text>
                </View>
                {item.active ? (
                  <View style={styles.activeDot} />
                ) : (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                )}
                <TouchableOpacity onPress={() => remove(pid)} hitSlop={8} style={{ marginLeft: spacing.sm }}>
                  <Ionicons name="trash-outline" size={18} color={colors.discount} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No price alerts"
              body="Open a product and tap the bell icon to get notified when its price drops."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  list: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  target: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});
