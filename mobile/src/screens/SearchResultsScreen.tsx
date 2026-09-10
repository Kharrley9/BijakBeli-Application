import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import CatalogList from '../components/CatalogList';

export default function SearchResultsScreen({ route }: any) {
  const { q } = route.params || {};
  return (
    <View style={styles.safe}>
      <AppHeader title={q ? `"${q}"` : 'Results'} />
      <CatalogList baseParams={{ q }} />
    </View>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.white } });
