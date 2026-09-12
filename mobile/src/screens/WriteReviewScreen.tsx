import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { FormField } from '../components/FormField';
import { reviewService } from '../services/dataService';

export default function WriteReviewScreen({ route, navigation }: any) {
  const { orderId, storeName, orderNumber } = route.params || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await reviewService.create({ orderId, rating, comment: comment.trim() || undefined });
      Alert.alert('Thanks!', 'Your review has been posted.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not post review', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Write a Review" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.storeName}>{storeName}</Text>
          {!!orderNumber && <Text style={styles.orderNumber}>Order {orderNumber}</Text>}

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={8}>
                <Ionicons
                  name={n <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={colors.accent}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder="How was your experience?"
            multiline
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.btn, busy && { opacity: 0.7 }]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={commonStyles.primaryButtonText}>Post Review</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  storeName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, textAlign: 'center' },
  orderNumber: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2, marginBottom: spacing.lg },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing.xl },
  btn: { marginTop: spacing.lg },
});
