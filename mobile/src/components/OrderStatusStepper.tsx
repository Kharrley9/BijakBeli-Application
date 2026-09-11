import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme/theme';
import { ORDER_FLOW, ORDER_STATUS_LABELS } from '../constants';
import { Fulfilment, OrderStatus } from '../types';

export default function OrderStatusStepper({
  status,
  fulfilment,
}: {
  status: OrderStatus;
  fulfilment: Fulfilment;
}) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledRow}>
        <Ionicons name="close-circle" size={20} color={colors.discount} />
        <Text style={styles.cancelledText}>Order cancelled</Text>
      </View>
    );
  }

  const flow = ORDER_FLOW[fulfilment] || ORDER_FLOW.pickup;
  const curIdx = flow.indexOf(status);

  return (
    <View style={styles.wrap}>
      {flow.map((s, i) => {
        const done = i < curIdx;
        const active = i === curIdx;
        return (
          <View key={s} style={styles.stepRow}>
            <View style={styles.rail}>
              <View style={[styles.dot, (done || active) && styles.dotFilled, active && styles.dotActive]}>
                {done && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
              {i < flow.length - 1 && <View style={[styles.line, done && styles.lineFilled]} />}
            </View>
            <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]}>
              {ORDER_STATUS_LABELS[s] || s}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  rail: { alignItems: 'center', width: 24 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.border },
  lineFilled: { backgroundColor: colors.primary },
  label: {
    marginLeft: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingTop: 1,
  },
  labelActive: { color: colors.primary, fontWeight: '800' },
  labelDone: { color: colors.text, fontWeight: '600' },
  cancelledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: spacing.md,
  },
  cancelledText: { color: colors.discount, fontWeight: '700' },
});
