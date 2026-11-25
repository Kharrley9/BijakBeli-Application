/**
 * Display helpers. PriceCatcher names items in capitals
 * ("KUBIS BULAT IMPORT (CHINA)"); shown in title case they are much easier to read.
 * Display only: search and data keep the original names.
 */

// Units and short forms that stay as written.
const KEEP = new Set(['kg', 'g', 'ml', 'l', 'gm', 'm', 's', 'xl', 'xxl']);

export function prettyName(name?: string | null): string {
  if (!name) return '';
  // Leave mixed-case names alone: someone already chose their casing.
  if (name !== name.toUpperCase()) return name;
  return name
    .replace(/\s{2,}/g, ' ')
    .toLowerCase()
    .replace(/(\d)\s*(kg|gm|g|ml|l)\b/g, '$1$2') // "1 KG" -> "1kg"
    .replace(/(^|[\s(/\-–])([a-zÀ-ɏ])([a-zÀ-ɏ']*)/g, (m, pre, first, rest) =>
      KEEP.has(first + rest) ? m : `${pre}${first.toUpperCase()}${rest}`
    );
}

/** "6 stores nearby" with a buyer location, else "248 stores". */
export function storeCountLabel(p: { storeCount?: number; nearbyStoreCount?: number; priceScope?: string }): string {
  const nearby = p.priceScope === 'nearby' && p.nearbyStoreCount != null;
  const n = nearby ? p.nearbyStoreCount! : p.storeCount ?? 0;
  if (!n) return '';
  return `${n} ${n === 1 ? 'store' : 'stores'}${nearby ? ' nearby' : ''}`;
}

/** "RM12.50" (or an em dash when there is no price). */
export function rm(value?: number | null): string {
  return value == null || Number.isNaN(value) ? '—' : `RM${Number(value).toFixed(2)}`;
}
