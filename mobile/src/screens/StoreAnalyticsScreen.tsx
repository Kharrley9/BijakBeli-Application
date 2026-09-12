import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { merchantService } from '../services/dataService';
import { StoreAnalytics } from '../types';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

const screenWidth = Dimensions.get('window').width;

export default function StoreAnalyticsScreen() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<StoreAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      merchantService
        .getAnalytics(days)
        .then((res: any) => alive && setData(res.data))
        .catch(() => {})
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }, [days])
  );

  // Downsample to at most ~10 labelled points so the chart stays readable.
  const chartPoints = React.useMemo(() => {
    if (!data) return null;
    const series = data.daily;
    const step = Math.max(1, Math.ceil(series.length / 10));
    const sampled = series.filter((_, i) => i % step === 0 || i === series.length - 1);
    return {
      labels: sampled.map((d) => d.date.slice(5)),
      datasets: [{ data: sampled.map((d) => d.revenue) }],
    };
  }, [data]);

  return (
    <View style={styles.safe}>
      <AppHeader title="Store Analytics" />
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.rangeChip, days === r.value && styles.rangeChipActive]}
            onPress={() => setDays(r.value)}
          >
            <Text style={[styles.rangeText, days === r.value && styles.rangeTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading || !data ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.statGrid}>
            <Stat label="Revenue" value={`RM${data.totalRevenue.toFixed(0)}`} />
            <Stat label="Orders" value={String(data.totalOrders)} />
            <Stat label="Avg order" value={`RM${data.avgOrderValue.toFixed(0)}`} />
            <Stat label="Cancelled" value={String(data.cancelledOrders)} />
          </View>

          <Text style={styles.sectionTitle}>Revenue over time</Text>
          {chartPoints && chartPoints.datasets[0].data.some((v) => v > 0) ? (
            <LineChart
              data={chartPoints}
              width={screenWidth - spacing.lg * 2}
              height={200}
              yAxisLabel="RM"
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                labelColor: () => colors.textMuted,
                propsForDots: { r: '3' },
              }}
              bezier
              style={{ borderRadius: 12 }}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No revenue in this period yet.</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Top products</Text>
          {data.topProducts.length === 0 ? (
            <Text style={styles.empty}>No sales yet.</Text>
          ) : (
            data.topProducts.map((p, i) => (
              <View key={i} style={styles.productRow}>
                <Text style={styles.productRank}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productMeta}>{p.qty} sold</Text>
                </View>
                <Text style={styles.productRevenue}>RM{p.revenue.toFixed(2)}</Text>
              </View>
            ))
          )}

          <View style={styles.footerStats}>
            <Text style={styles.footerText}>{data.views} profile views</Text>
            <Text style={styles.footerText}>{data.rating.toFixed(1)}★ ({data.reviewCount} reviews)</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  rangeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  rangeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rangeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  rangeTextActive: { color: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stat: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  emptyChart: {
    height: 120,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: { color: colors.textMuted },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
  productRow: {
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
  productRank: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, width: 20 },
  productName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  productMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  productRevenue: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  footerStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  footerText: { fontSize: fontSize.xs, color: colors.textMuted },
});
