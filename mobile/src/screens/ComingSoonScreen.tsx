import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';

export default function ComingSoonScreen({ route }: any) {
  const { title = 'Coming soon', note, back = true } = route?.params || {};
  return (
    <View style={styles.safe}>
      <AppHeader title={title} back={back} />
      <EmptyState
        icon="construct-outline"
        title={title}
        body={note || 'This feature arrives in the next phase.'}
      />
    </View>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.white } });
