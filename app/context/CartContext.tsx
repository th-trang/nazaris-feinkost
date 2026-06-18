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

type ComboKey = "borek" | "rolle";

interface ComboDeal {
  key: ComboKey;
  name: string;
  bundleSize: number;
  bundlePrice: number;
}

export interface AppliedCombo {
  key: ComboKey;
  productId: ComboKey;
  name: string;
  label: string;
  comboCount: number;
  totalSavings: number;
  comboPrice: number;
}

export interface ComboUpsell {
  key: ComboKey;
  name: string;
  needed: number;
  comboPrice: number;
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
  cartTotal: number;
  cartTotalWithCombos: number;
  comboSavings: number;
  appliedCombos: AppliedCombo[];
  comboUpsells: ComboUpsell[];
  cartPricingError: string | null;
  cartPricingBreakdown: Record<string, unknown> | null;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const COMBO_DEALS: ComboDeal[] = [
  { key: "borek", name: "Börek", bundleSize: 3, bundlePrice: 5 },
  { key: "rolle", name: "Rolle", bundleSize: 3, bundlePrice: 9 },
];

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeLabel = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getComboKey = (item: CartItem): ComboKey | null => {
  if (item.pricingUnit !== "per_item") {
    return null;
  }

  const normalized = normalizeLabel(`${item.name} ${item.category}`);
  if (normalized.includes("borek") || normalized.includes("boerek")) {
    return "borek";
  }
  if (normalized.includes("rolle") || normalized.includes("roll")) {
    return "rolle";
  }

  return null;
};

const getUnitPriceForItem = (item: CartItem): number => {
  if (item.pricingUnit !== "per_item") {
    return item.price;
  }

  if (item.pieces && item.pieces > 0) {
    return item.price / item.pieces;
  }

  return item.price;
};

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

  const {cartSubtotal, cartTotalWithCombos, comboSavings, appliedCombos, comboUpsells} = useMemo(() => {
    const subtotal = roundCurrency(
      cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const dealResults = COMBO_DEALS.map((deal) => {
      const unitPrices: number[] = [];

      for (const item of cartItems) {
        if (getComboKey(item) !== deal.key) {
          continue;
        }

        const unitPrice = getUnitPriceForItem(item);
        const units = item.pieces && item.pieces > 0
          ? item.pieces * item.quantity
          : item.quantity;

        for (let i = 0; i < units; i += 1) {
          unitPrices.push(unitPrice);
        }
      }

      unitPrices.sort((a, b) => b - a);

      const comboCount = Math.floor(unitPrices.length / deal.bundleSize);
      const originalTotal = unitPrices.reduce((sum, price) => sum + price, 0);

      let discountedTotal = 0;
      let index = 0;

      while (index + deal.bundleSize <= unitPrices.length) {
        const bundleSum = unitPrices
          .slice(index, index + deal.bundleSize)
          .reduce((sum, price) => sum + price, 0);
        discountedTotal += Math.min(deal.bundlePrice, bundleSum);
        index += deal.bundleSize;
      }

      while (index < unitPrices.length) {
        discountedTotal += unitPrices[index];
        index += 1;
      }

      const savings = roundCurrency(originalTotal - discountedTotal);
      const remainder = unitPrices.length % deal.bundleSize;
      const needed = remainder === 0 ? 0 : deal.bundleSize - remainder;

      return {
        deal,
        originalTotal: roundCurrency(originalTotal),
        discountedTotal: roundCurrency(discountedTotal),
        savings,
        comboCount,
        totalUnits: unitPrices.length,
        needed,
      };
    });

    const categoryOriginalTotal = roundCurrency(
      dealResults.reduce((sum, result) => sum + result.originalTotal, 0),
    );
    const categoryDiscountedTotal = roundCurrency(
      dealResults.reduce((sum, result) => sum + result.discountedTotal, 0),
    );

    const untouchedTotal = roundCurrency(
      cartItems
        .filter((item) => getComboKey(item) === null)
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const totalWithCombos = roundCurrency(categoryDiscountedTotal + untouchedTotal);
    const totalSavings = roundCurrency(categoryOriginalTotal - categoryDiscountedTotal);

    const combos: AppliedCombo[] = dealResults
      .filter((result) => result.comboCount > 0 && result.savings > 0)
      .map((result) => ({
        key: result.deal.key,
        productId: result.deal.key,
        name: result.deal.name,
        label: `${result.deal.bundleSize}× ${result.deal.name} Kombo`,
        comboCount: result.comboCount,
        totalSavings: result.savings,
        comboPrice: result.deal.bundlePrice,
      }));

    const upsells: ComboUpsell[] = dealResults
      .filter((result) => result.totalUnits > 0 && result.needed > 0)
      .map((result) => ({
        key: result.deal.key,
        name: result.deal.name,
        needed: result.needed,
        comboPrice: result.deal.bundlePrice,
      }));

    return {
      cartSubtotal: subtotal,
      cartTotalWithCombos: totalWithCombos,
      comboSavings: totalSavings,
      appliedCombos: combos,
      comboUpsells: upsells,
    };
  }, [cartItems]);

  const cartTotal = cartTotalWithCombos;

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
        cartTotal,
        cartTotalWithCombos,
        comboSavings,
        appliedCombos,
        comboUpsells,
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
