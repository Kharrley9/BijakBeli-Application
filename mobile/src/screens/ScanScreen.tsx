import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { productService } from '../services/dataService';
import { prettyName } from '../utils/format';

// QR for BijakBeli labels; the 1D types are what store shelves and scale labels use.
const BARCODE_TYPES = ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'] as const;

type Mode = 'photo' | 'barcode';
type Match = { product: { _id: string; productName: string; unit: string }; confidence: number };
type Quota = {
  configured: boolean;
  perDay: number;
  remainingToday: number;
  resetsAtMalaysia: string;
  waitSeconds: number;
};

/** Smallest camera size whose long side is at least 1024 px: enough for the AI, quick to upload. */
function pickPictureSize(sizes: string[]): string | undefined {
  const parsed = sizes
    .map((s) => {
      const [w, h] = s.split('x').map(Number);
      return { s, w, h };
    })
    .filter((x) => x.w > 0 && x.h > 0 && Math.max(x.w, x.h) >= 1024)
    .sort((a, b) => a.w * a.h - b.w * b.h);
  return parsed[0]?.s;
}

/**
 * Scan a fresh item and jump straight to its store prices, cheapest first.
 *  - Photo (default): photograph the item itself; Google Gemini picks the matching
 *    catalogue items (free tier, limited scans per day; the server enforces the limit).
 *  - Barcode: a BijakBeli QR label or a store barcode that buyers have linked.
 */
export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const camera = useRef<CameraView>(null);
  const [mode, setMode] = useState<Mode>('photo');
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pictureSize, setPictureSize] = useState<string | undefined>();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [result, setResult] = useState<{ seen: string; matches: Match[] } | null>(null);
  // The camera reports the same barcode many times a second; handle only the first.
  const locked = useRef(false);

  const loadQuota = useCallback(async () => {
    try {
      const res: any = await productService.photoScanQuota();
      setQuota(res?.data || null);
    } catch {
      // quota line is informative only
    }
  }, []);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  const onCameraReady = useCallback(async () => {
    try {
      const sizes = await camera.current?.getAvailablePictureSizesAsync();
      if (sizes?.length) setPictureSize(pickPictureSize(sizes));
    } catch {
      // keep the default size
    }
  }, []);

  const openPrices = (product: Match['product'], extra: Record<string, any> = {}) =>
    navigation.replace('PriceComparison', {
      productId: product._id,
      productName: product.productName,
      unit: product.unit,
      sort: 'price',
      ...extra,
    });

  // ── Barcode mode ──
  const onScanned = useCallback(
    async ({ data, type }: BarcodeScanningResult) => {
      if (locked.current) return;
      locked.current = true;
      setBusy(true);
      setError(null);
      try {
        const res: any = await productService.lookupByScan(data, String(type));
        if (!res?.data && res?.unknownBarcode) {
          navigation.replace('LinkBarcode', { code: data, kind: res.unknownBarcode.kind });
          return;
        }
        // Only a buyer-made link can be wrong; offer to correct it on the next screen.
        openPrices(res.data, {
          linkedBarcode: res.source === 'link' ? { code: data, kind: res.barcode?.kind } : undefined,
        });
      } catch (e: any) {
        setError(e?.message || 'Could not read this code');
        setBusy(false);
      }
    },
    [navigation]
  );

  // ── Photo mode ──
  const takePhoto = async () => {
    if (busy || !camera.current) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.6, base64: true });
      if (!pic?.base64) throw new Error('Could not take the photo. Please try again.');
      const res: any = await productService.recognizePhoto(pic.base64);
      const data = res?.data;
      if (data?.quota) setQuota(data.quota);
      setResult({ seen: data?.seen || '', matches: data?.matches || [] });
    } catch (e: any) {
      setError(e?.message || 'Photo scan failed. Please try again.');
      loadQuota();
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setError(null);
    setResult(null);
    locked.current = false;
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    reset();
    setBusy(false);
    setMode(m);
  };

  if (!permission) {
    return <View style={styles.black} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Ionicons name="camera-outline" size={56} color={colors.primary} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permText}>
          BijakBeli uses the camera only to recognise fresh items (or their barcode) and show which store sells
          them cheapest.
        </Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        >
          <Text style={styles.permBtnText}>{permission.canAskAgain ? 'Allow camera' : 'Open settings'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }}>
          <Text style={styles.permCancel}>Not now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const photoBlocked = mode === 'photo' && !!quota && (!quota.configured || quota.remainingToday <= 0);

  return (
    <View style={styles.black}>
      <StatusBar style="light" />
      {/* Only one camera preview may run at a time, so unmount it when the screen is hidden. */}
      {isFocused && (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          pictureSize={pictureSize}
          onCameraReady={onCameraReady}
          barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: [...BARCODE_TYPES] } : undefined}
          onBarcodeScanned={mode === 'barcode' && !busy && !error ? onScanned : undefined}
        />
      )}

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.modeSwitch}>
            <ModeTab label="Photo (AI)" icon="sparkles-outline" active={mode === 'photo'} onPress={() => switchMode('photo')} />
            <ModeTab label="Barcode" icon="barcode-outline" active={mode === 'barcode'} onPress={() => switchMode('barcode')} />
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch((t) => !t)} hitSlop={10}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {!result && (
          <View style={styles.frameWrap}>
            <View style={[styles.frame, mode === 'photo' && styles.framePhoto]}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              {busy && <ActivityIndicator size="large" color={colors.white} />}
            </View>
          </View>
        )}

        <View style={styles.bottom}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={colors.white} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.againBtn} onPress={reset}>
                <Text style={styles.againText}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : result ? (
            <ResultSheet
              result={result}
              onPick={(m) => openPrices(m.product)}
              onRetake={reset}
              onSearch={() => navigation.popTo('Tabs', { screen: 'Search' })}
            />
          ) : mode === 'photo' ? (
            <>
              <Text style={styles.hint}>
                {busy
                  ? 'Recognising the item…'
                  : photoBlocked && quota && !quota.configured
                    ? 'Photo scan is not set up on the server yet. Use Barcode, or search.'
                    : photoBlocked
                      ? `Today's free AI scans are used up. They reset at ${quota?.resetsAtMalaysia}.`
                      : 'Fill the frame with one fresh item (e.g. tomatoes, a fish, a tray of chicken), then tap the button'}
              </Text>
              <TouchableOpacity
                style={[styles.shutter, (busy || photoBlocked) && styles.shutterOff]}
                onPress={takePhoto}
                disabled={busy || photoBlocked}
                accessibilityLabel="Take photo"
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
              {!!quota?.configured && (
                <Text style={styles.quota}>
                  Free AI scans left today: {quota.remainingToday}/{quota.perDay} · resets {quota.resetsAtMalaysia}
                </Text>
              )}
              <Text style={styles.privacy}>Photos are sent to Google Gemini to identify the item.</Text>
            </>
          ) : (
            <Text style={styles.hint}>
              {busy ? 'Finding the cheapest store…' : 'Point at the barcode (or BijakBeli QR) on a fresh item'}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function ModeTab({ label, icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.modeTab, active && styles.modeTabOn]} onPress={onPress}>
      <Ionicons name={icon} size={14} color={active ? colors.text : colors.white} />
      <Text style={[styles.modeText, active && styles.modeTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ResultSheet({
  result,
  onPick,
  onRetake,
  onSearch,
}: {
  result: { seen: string; matches: Match[] };
  onPick: (m: Match) => void;
  onRetake: () => void;
  onSearch: () => void;
}) {
  return (
    <View style={styles.sheet}>
      {result.matches.length ? (
        <>
          <Text style={styles.sheetTitle}>Which one is it?</Text>
          {!!result.seen && <Text style={styles.sheetSeen}>Seen: {result.seen}</Text>}
          <ScrollView style={{ maxHeight: 260 }}>
            {result.matches.map((m, i) => (
              <TouchableOpacity key={m.product._id} style={[styles.match, i === 0 && styles.matchTop]} onPress={() => onPick(m)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName} numberOfLines={2}>{prettyName(m.product.productName)}</Text>
                  <Text style={styles.matchUnit}>{m.product.unit}</Text>
                </View>
                <Text style={styles.matchConf}>{Math.round(m.confidence * 100)}%</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <Text style={styles.sheetTitle}>No matching item found</Text>
          <Text style={styles.sheetSeen}>
            {result.seen ? `Seen: ${result.seen}. ` : ''}It may not be one of the fresh items we have prices for.
          </Text>
        </>
      )}
      <View style={styles.sheetActions}>
        <TouchableOpacity style={styles.sheetBtn} onPress={onRetake}>
          <Ionicons name="camera-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.sheetBtnText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetBtn} onPress={onSearch}>
          <Ionicons name="search-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.sheetBtnText}>Search instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Barcode frame is wide (1D barcodes are long strips); the photo frame is square.
const FRAME_W = 290;
const FRAME_H = 210;
const CORNER = 34;

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitch: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: 3 },
  modeTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999 },
  modeTabOn: { backgroundColor: colors.white },
  modeText: { color: colors.white, fontWeight: '700', fontSize: fontSize.xs },
  modeTextOn: { color: colors.text },
  frameWrap: { alignItems: 'center' },
  frame: { width: FRAME_W, height: FRAME_H, alignItems: 'center', justifyContent: 'center' },
  framePhoto: { width: FRAME_W, height: FRAME_W },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  bottom: { padding: spacing.lg, paddingBottom: spacing.xl, alignItems: 'stretch' },
  hint: {
    color: colors.white,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.md,
    padding: spacing.md,
    overflow: 'hidden',
  },
  shutter: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOff: { opacity: 0.4 },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
  quota: { color: colors.white, textAlign: 'center', fontSize: fontSize.xs, fontWeight: '700', marginTop: spacing.md },
  privacy: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontSize: 10, marginTop: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(185,28,28,0.92)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm, flex: 1 },
  againBtn: { backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 6 },
  againText: { color: colors.text, fontWeight: '800', fontSize: fontSize.xs },
  sheet: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg },
  sheetTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  sheetSeen: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matchTop: { backgroundColor: colors.primaryLight, borderRadius: radius.sm },
  matchName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  matchUnit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  matchConf: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primaryDark },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  sheetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  sheetBtnText: { color: colors.primaryDark, fontWeight: '800', fontSize: fontSize.sm },
  permission: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  permText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  permBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  permBtnText: { color: colors.white, fontWeight: '800', fontSize: fontSize.md },
  permCancel: { color: colors.textMuted, fontWeight: '600' },
});
