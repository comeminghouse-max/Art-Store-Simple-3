import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useUser } from "@clerk/react";

export interface CartItem {
  artworkId: number;
  title: string;
  price: number;
  imageUrl: string;
  medium: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem,"quantity">, qty?: number) => void;
  removeItem: (artworkId: number) => void;
  updateQuantity: (artworkId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  count: number;
  pendingOrderId: number | null;
  setPendingOrderId: (id: number | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const DRAFT_ORDER_KEY = "studio-draft-order-id";

function getStorageKey(userId: string | null) {
  return userId ? `studio-cart-${userId}` : `studio-cart-guest`;
}

function normalizeItem(item: any): CartItem {
  return {
    artworkId: Number(item.artworkId),
    title: String(item.title || ""),
    price: Number(item.price) || 0,
    imageUrl: String(item.imageUrl || ""),
    medium: String(item.medium || ""),
    quantity: Math.max(1, Number(item.quantity) || 1),
  };
}

function loadLocal(userId: string | null): CartItem[] {
  try {
    const s = localStorage.getItem(getStorageKey(userId));
    const parsed = s ? JSON.parse(s) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeItem) : [];
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userId = user?.id || null;

  const [items, setItems] = useState<CartItem[]>(() => loadLocal(null));
  const [isOpen, setIsOpen] = useState(false);
  const [pendingOrderId, setPendingOrderIdState] = useState<number|null>(() => {
    try { const s = localStorage.getItem(DRAFT_ORDER_KEY); return s ? Number(s) : null; } catch { return null; }
  });

  const syncTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const isSyncingRef = useRef(false);

  // Load cart khi userId thay đổi
  useEffect(() => {
    setItems(loadLocal(userId));
  }, [userId]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
  }, [items, userId]);

  const setPendingOrderId = useCallback((id: number | null) => {
    setPendingOrderIdState(id);
    if (id) localStorage.setItem(DRAFT_ORDER_KEY, String(id));
    else localStorage.removeItem(DRAFT_ORDER_KEY);
  }, []);

  // ── Auto-sync cart → draft order ────────────────────────────────────────
  // Tạo hoặc cập nhật 1 order status="cart" mỗi khi giỏ thay đổi
  const syncCartToOrder = useCallback(async (cartItems: CartItem[]) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const storedId = localStorage.getItem(DRAFT_ORDER_KEY);
      const draftId = storedId ? Number(storedId) : null;
      const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

      const orderItems = cartItems.map(i => ({
        artworkId: i.artworkId,
        title: i.title,
        price: i.price,
        imageUrl: i.imageUrl,
        medium: i.medium,
        quantity: i.quantity,
      }));

      if (cartItems.length === 0) {
        // Giỏ trống → đánh dấu draft order là removed nếu có
        if (draftId) {
          await fetch(`${API}/api/orders/${draftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "removed" }),
          });
          setPendingOrderId(null);
        }
        return;
      }

      if (draftId) {
        // Đã có draft order → cập nhật items + total
        const res = await fetch(`${API}/api/orders/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: orderItems, total: cartTotal }),
        });
        if (!res.ok) {
          // Order không còn tồn tại → tạo mới
          setPendingOrderId(null);
          await createDraftOrder(orderItems, cartTotal);
        }
      } else {
        // Chưa có → tạo draft order mới
        await createDraftOrder(orderItems, cartTotal);
      }
    } catch (err) {
      console.error("Cart sync error:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const createDraftOrder = async (orderItems: any[], total: number) => {
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: null,
          items: orderItems,
          total: total,
          customerName: "— Khách chưa điền —",
          customerEmail: "unknown@cart",
          shippingAddress: "— Chưa có —",
          status: "cart",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orderId) setPendingOrderId(data.orderId);
      }
    } catch (err) {
      console.error("Create draft order error:", err);
    }
  };

  // Debounced sync — chờ 1s sau khi cart thay đổi mới sync
  const triggerSync = useCallback((updatedItems: CartItem[]) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncCartToOrder(updatedItems);
    }, 1000);
  }, [syncCartToOrder]);

  useEffect(() => () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  }, []);

  // ── Cart actions ──────────────────────────────────────────────────────────
  const addItem = useCallback((item: Omit<CartItem,"quantity">, qty = 1) => {
    setItems(prev => {
      const exists = prev.find(i => i.artworkId === item.artworkId);
      if (exists) return prev;
      const updated = [...prev, normalizeItem({ ...item, quantity: qty })];
      triggerSync(updated);
      return updated;
    });
    setIsOpen(true);
  }, [triggerSync]);

  const removeItem = useCallback((artworkId: number) => {
    setItems(prev => {
      const updated = prev.filter(i => i.artworkId !== artworkId);
      triggerSync(updated);
      return updated;
    });
  }, [triggerSync]);

  const updateQuantity = useCallback((artworkId: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => {
      const updated = prev.map(i => i.artworkId === artworkId ? { ...i, quantity } : i);
      triggerSync(updated);
      return updated;
    });
  }, [triggerSync]);

  const clearCart = useCallback(() => {
    setItems([]);
    setPendingOrderId(null);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  }, [setPendingOrderId]);

  const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, updateQuantity,
      clearCart, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
      total, count, pendingOrderId, setPendingOrderId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
