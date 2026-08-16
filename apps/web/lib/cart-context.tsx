"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, PublicMenuItem } from "./types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: PublicMenuItem, quantity: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  totalCents: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `cart:${slug}`;
}

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(items));
    } catch {
      // ignore storage write failures (e.g. private browsing)
    }
  }, [items, slug, hydrated]);

  function addItem(item: PublicMenuItem, quantity: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, priceCents: item.priceCents, quantity }];
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)));
  }

  function removeItem(menuItemId: string) {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }

  function clear() {
    setItems([]);
  }

  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totalCents, totalQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
