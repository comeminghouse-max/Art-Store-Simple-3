import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  artworkId: number;
  title: string;
  price: number;
  imageUrl: string;
  medium: string;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (artworkId: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "studio-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.artworkId === item.artworkId);
      if (exists) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  };

  const removeItem = (artworkId: number) => {
    setItems((prev) => prev.filter((i) => i.artworkId !== artworkId));
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const count = items.length;

  return (
    <CartContext.Provider value={{ items, isOpen, addItem, removeItem, clearCart, openCart, closeCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
