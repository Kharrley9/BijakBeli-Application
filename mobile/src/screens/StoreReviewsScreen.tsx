import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import RatingStars from '../components/RatingStars';
import { reviewService } from '../services/dataService';
import { Review } from '../types';

export default function StoreReviewsScreen({ route }: any) {
  const { storeId, storeName } = route.params || {};
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      reviewService
        .listForStore(storeId)
        .then((res: any) => {
          if (!alive) return;
          setReviews(res.data || []);
          setTotal(res.total || 0);
        })
        .catch(() => {})
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }, [storeId])
  );

  return (
    <View style={styles.safe}>
      <AppHeader title={`Reviews${total ? ` (${total})` : ''}`} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r._id}
          contentContainerStyle={reviews.length ? styles.list : styles.emptyWrap}
          renderItem={({ item }) => {
            const user = typeof item.userId === 'object' ? item.userId : null;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{user?.fullName || 'Buyer'}</Text>
                  <RatingStars rating={item.rating} showNumber={false} size={14} />
                </View>
                {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="star-outline" title="No reviews yet" body={`Be the first to review ${storeName || 'this store'}.`} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  comment: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
});
