import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import CatalogList from '../components/CatalogList';

export default function CategoryBrowseScreen({ route }: any) {
  const { categoryId, label } = route.params || {};

  return (
    <View style={styles.safe}>
      <AppHeader title={label || 'Category'} />
      <CatalogList baseParams={{ categoryId }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
});
