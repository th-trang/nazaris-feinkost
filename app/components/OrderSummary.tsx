"use client";

import { useTranslations } from "next-intl";
import { CartItem } from "../context/CartContext";

interface OrderSummaryProps {
  isSubmitting: boolean;
  submitError: string | null;
  cartItems: CartItem[];
  cartSubtotal: number;
  cartDiscount: number;
  cartDiscountPercent: number;
  bundleDiscountRolle: number;
  bundleDiscountBoerek: number;
  rolleBundleFreeCount: number;
  boerekBundleFreeCount: number;
  cartTotal: number;
  cartPricingError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function OrderSummary({
  isSubmitting,
  submitError,
  cartItems,
  cartSubtotal,
  cartDiscount,
  cartDiscountPercent,
  bundleDiscountRolle,
  bundleDiscountBoerek,
  rolleBundleFreeCount,
  boerekBundleFreeCount,
  cartTotal,
  cartPricingError,
  onSubmit,
}: OrderSummaryProps) {
  const t = useTranslations("checkout");


  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-24">
      <h2 className="text-2xl text-gray-900 mb-6">{t("orderSummary")}</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-3 py-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-gray-900 truncate">{item.name}</h3>
              <p className="text-xs text-gray-600">
                {item.weightInGrams
                  ? `${item.weightInGrams} ${t("grams")}`
                  : item.pieces
                    ? `${item.pieces} ${t("pieces")}`
                    : `${t("quantity")}: ${item.quantity}`}
              </p>
              <p className="text-sm text-gray-900 mt-1">
                €{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        {(cartDiscountPercent > 0 || bundleDiscountRolle > 0 || bundleDiscountBoerek > 0) && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>{t("subtotal")}</span>
            <span>€{cartSubtotal.toFixed(2)}</span>
          </div>
        )}
        {bundleDiscountRolle > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t("rolleBundle", { count: rolleBundleFreeCount })}</span>
            <span>-€{bundleDiscountRolle.toFixed(2)}</span>
          </div>
        )}
        {bundleDiscountBoerek > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t("boerekBundle", { count: boerekBundleFreeCount })}</span>
            <span>-€{bundleDiscountBoerek.toFixed(2)}</span>
          </div>
        )}
        {cartDiscountPercent > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t("discount")} ({cartDiscountPercent}%)</span>
            <span>-€{cartDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500">
          <span>{t("netto")}</span>
          <span>€{(cartTotal / 1.07).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{t("vat")}</span>
          <span>€{(cartTotal - cartTotal / 1.07).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-2 mt-1">
          <span>{t("total")}</span>
          <span className="text-3xl">€{cartTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting || !!cartPricingError}
        className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t("placeOrderProcessing") : t("placeOrder")}
      </button>

      {submitError && (
        <p className="text-sm text-red-600 text-center mt-3">{submitError}</p>
      )}

      <p className="text-xs text-gray-600 text-center mt-4">
        {t("termsNotice")}
      </p>
    </div>
  );
}
