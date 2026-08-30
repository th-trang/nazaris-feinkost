import { CartItem } from "@/app/context/CartContext";
import { CartLineInput } from "@/app/lib/orders/types";

/**
 * Reduces the cart to what the backend is allowed to be told: which product,
 * and how much of it. Names, prices and discounts are resolved server-side
 * from the product catalog, so nothing here can influence the amount charged.
 */
export const toCartLines = (cartItems: CartItem[]): CartLineInput[] =>
  cartItems.map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    ...(item.pricingUnit === "per_100g"
      ? { weightInGrams: item.weightInGrams }
      : { pieces: item.pieces ?? 1 }),
  }));
