import { CartItem } from "@/app/context/CartContext";
import { CartLineInput } from "@/app/lib/orders/types";

export const toCartLines = (cartItems: CartItem[]): CartLineInput[] =>
  cartItems.map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    ...(item.pricingUnit === "per_100g"
      ? { weightInGrams: item.weightInGrams }
      : { pieces: item.pieces ?? 1 }),
  }));
