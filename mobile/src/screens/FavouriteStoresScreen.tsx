import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import StoreCard from '../components/StoreCard';
import { favoriteStoreService } from '../services/dataService';
import { FavoriteStoreEntry } from '../types';

export default function FavouriteStoresScreen({ navigation }: any) {
  const [favorites, setFavorites] = useState<FavoriteStoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      favoriteStoreService
        .listMine()
        .then((res: any) => alive && setFavorites(res.data || []))
        .catch(() => {})
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <View style={styles.safe}>
      <AppHeader title="Favourite Stores" />
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(f) => f._id}
          contentContainerStyle={favorites.length ? styles.list : styles.emptyWrap}
          renderItem={({ item }) => (
            <StoreCard
              store={item.storeId}
              onPress={() => navigation.navigate('StoreProfile', { id: item.storeId._id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No favourite stores"
              body="Tap the heart on a store's page to save it here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  list: { padding: spacing.lg },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
