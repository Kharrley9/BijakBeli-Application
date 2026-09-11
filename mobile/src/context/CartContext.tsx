import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartLine } from '../types';

const STORAGE_KEY = 'cart_v1';

export interface CartGroup {
  storeId: string;
  storeName: string;
  storeKind?: string;
  deliveryAvailable: boolean;
  deliveryFee: number;
  pickupAvailable: boolean;
  lines: CartLine[];
  subtotal: number;
  qty: number;
}

interface CartContextData {
  lines: CartLine[];
  ready: boolean;
  count: number;
  groups: CartGroup[];
  groupFor: (storeId: string) => CartGroup | undefined;
  addItem: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearStore: (storeId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLines(JSON.parse(raw));
      } catch {
        /* ignore */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const addItem = useCallback(
    (line: Omit<CartLine, 'qty'>, qty = 1) => {
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.productId === line.productId);
        let next: CartLine[];
        if (idx >= 0) {
          const cap = prev[idx].stock ?? Infinity;
          next = prev.map((l, i) =>
            i === idx ? { ...l, ...line, qty: Math.min(cap, l.qty + qty) } : l
          );
        } else {
          const cap = line.stock ?? Infinity;
          next = [...prev, { ...line, qty: Math.min(cap, Math.max(1, qty)) }];
        }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setLines((prev) => {
        const next =
          qty <= 0
            ? prev.filter((l) => l.productId !== productId)
            : prev.map((l) =>
                l.productId === productId
                  ? { ...l, qty: Math.min(l.stock ?? Infinity, qty) }
                  : l
              );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => setQty(productId, 0), [setQty]);

  const clearStore = useCallback(
    (storeId: string) => persist(lines.filter((l) => l.storeId !== storeId)),
    [lines, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const groups = useMemo<CartGroup[]>(() => {
    const map = new Map<string, CartGroup>();
    for (const l of lines) {
      if (!map.has(l.storeId)) {
        map.set(l.storeId, {
          storeId: l.storeId,
          storeName: l.storeName,
          storeKind: l.storeKind,
          deliveryAvailable: !!l.deliveryAvailable,
          deliveryFee: l.deliveryFee || 0,
          pickupAvailable: l.pickupAvailable !== false,
          lines: [],
          subtotal: 0,
          qty: 0,
        });
      }
      const g = map.get(l.storeId)!;
      g.lines.push(l);
      g.subtotal += l.unitPrice * l.qty;
      g.qty += l.qty;
    }
    return Array.from(map.values());
  }, [lines]);

  const groupFor = useCallback(
    (storeId: string) => groups.find((g) => g.storeId === storeId),
    [groups]
  );

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  return (
    <CartContext.Provider
      value={{ lines, ready, count, groups, groupFor, addItem, setQty, removeItem, clearStore, clear }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
