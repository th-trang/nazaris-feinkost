'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  weightInGrams?: number; // Weight for this cart item (weight-based products)
  pieces?: number;        // Number of pieces chosen (per-piece products)
  pricePer100g?: number; // Price per 100g for weight-based items
  pricePerPiece?: number; // Price per piece for piece-based items
  pricingUnit: "per_100g" | "per_item"; // To distinguish between weight-based and piece-based products
  cartItemId?: string; // Unique ID for cart item (different from product ID)
}



interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscountPercent: number;
  cartDiscount: number;
  cartTotal: number;
  minimumOrderMet: boolean;
  cartPricingError: string | null;
  cartPricingBreakdown: Record<string, unknown> | null;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);



const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeLabel = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();



export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCartItems((prevItems) => {
      // Normalize: strip weightInGrams when it's 0 (per-piece items)
      const normalizedItem = {
        ...item,
        weightInGrams: item.weightInGrams || undefined,
      };

      // Generate unique cart item ID
      const cartItemId = normalizedItem.weightInGrams 
        ? `${normalizedItem.id}-${normalizedItem.weightInGrams}` 
        : normalizedItem.id;
      
      const existingItem = prevItems.find((i) => i.cartItemId === cartItemId);
      
      if (existingItem) {
        return prevItems.map((i) =>
          i.cartItemId === cartItemId 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      
      return [...prevItems, { ...normalizedItem, quantity: 1, cartItemId }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId
          ? item.pricingUnit === "per_item" && item.pieces && item.pieces > 0
            ? {
                ...item,
                quantity: 1,
                pieces: quantity,
                price: roundCurrency((item.price / item.pieces) * quantity),
              }
            : { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setIsCartOpen(false);
  };

  const restoreCart = (items: CartItem[]) => {
    setCartItems(items);
  };

  const cartCount = cartItems.reduce((total, item) => {
    if (item.pricingUnit === "per_item" && item.pieces && item.pieces > 0) {
      return total + item.pieces;
    }
    return total + item.quantity;
  }, 0);

  const cartSubtotal = useMemo(() => {
    return roundCurrency(
      cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );
  }, [cartItems]);

  const MINIMUM_ORDER = 10;

  const cartDiscountPercent = cartSubtotal > 100 ? 15 : cartSubtotal > 50 ? 10 : 0;
  const cartDiscount = roundCurrency(cartSubtotal * (cartDiscountPercent / 100));
  const cartTotal = roundCurrency(cartSubtotal - cartDiscount);
  const minimumOrderMet = cartSubtotal >= MINIMUM_ORDER;

  // Validate pricing for all items
  const cartPricingError: string | null = cartItems.some(
    (item) => !item.pricingUnit || !item.price
  )
    ? "Some items are missing pricing information"
    : null;

  const cartPricingBreakdown: Record<string, unknown> | null = null; // Placeholder for future itemization

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        restoreCart,
        cartCount,
        cartSubtotal,
        cartDiscountPercent,
        cartDiscount,
        cartTotal,
        minimumOrderMet,
        cartPricingError,
        cartPricingBreakdown,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
