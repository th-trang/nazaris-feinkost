"use client";

import { useTranslations } from "next-intl";
import { CartItem, AppliedCombo } from "../context/CartContext";

interface OrderSummaryProps {
  isSubmitting: boolean;
  submitError: string | null;
  cartItems: CartItem[];
  cartTotal: number;
  cartPricingError: string | null;
  appliedCombos: AppliedCombo[];
  comboSavings: number;
  cartSubtotal: number;
  onSubmit: (e: React.FormEvent) => void;
}

export default function OrderSummary({
  isSubmitting,
  submitError,
  cartItems,
  cartTotal,
  cartPricingError,
  appliedCombos,
  comboSavings,
  cartSubtotal,
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
        {comboSavings > 0 && (
          <>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t("subtotal")}</span>
              <span>€{cartSubtotal.toFixed(2)}</span>
            </div>

            {appliedCombos.map((combo) => (
              <div
                key={combo.productId}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-green-700">
                  🏷️{" "}
                  {t("comboAppliedLabel", {
                    bundleSize: 3,
                    name: t(
                      combo.key === "borek"
                        ? "comboNameBorek"
                        : "comboNameRolle",
                    ),
                  })}
                  {combo.comboCount > 1 ? ` ×${combo.comboCount}` : ""}
                </span>
                <span className="font-semibold text-green-700">
                  −€{combo.totalSavings.toFixed(2)}
                </span>
              </div>
            ))}

            <div className="border-t border-dashed border-gray-200 pt-1" />
          </>
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

        {comboSavings > 0 && (
          <div className="rounded-xl bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            {t("comboSavingsMessage", { amount: comboSavings.toFixed(2) })}
          </div>
        )}
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
