import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import RatingStars from '../components/RatingStars';
import { reviewService } from '../services/dataService';
import { Order, OrderStoreSummary, Review } from '../types';

export default function MyReviewsScreen({ navigation }: any) {
  const [reviewable, setReviewable] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, b]: any = await Promise.all([
        reviewService.getReviewableOrders(),
        reviewService.listMine(),
      ]);
      setReviewable(a.data || []);
      setReviews(b.data || []);
    } catch {
      /* keep whatever we had */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.safe}>
        <AppHeader title="My Reviews" />
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <AppHeader title="My Reviews" />
      <FlatList
        data={reviews}
        keyExtractor={(r) => r._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {reviewable.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Orders to review</Text>
                {reviewable.map((o) => {
                  const store = o.storeId as OrderStoreSummary;
                  return (
                    <TouchableOpacity
                      key={o._id}
                      style={styles.reviewableRow}
                      onPress={() =>
                        navigation.navigate('WriteReview', {
                          orderId: o._id,
                          storeName: store?.storeName,
                          orderNumber: o.orderNumber,
                        })
                      }
                    >
                      <Ionicons name="star-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewableStore}>{store?.storeName}</Text>
                        <Text style={styles.reviewableMeta}>Order {o.orderNumber}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <Text style={styles.sectionTitle}>Your reviews</Text>
          </>
        }
        renderItem={({ item }) => {
          const store = typeof item.storeId === 'object' ? item.storeId : null;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.storeName}>{store?.storeName || 'Store'}</Text>
                <RatingStars rating={item.rating} showNumber={false} size={14} />
              </View>
              {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          reviewable.length === 0 ? (
            <EmptyState
              icon="star-outline"
              title="No reviews yet"
              body="Order something and share how it went."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  reviewableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewableStore: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  reviewableMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  comment: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
});
