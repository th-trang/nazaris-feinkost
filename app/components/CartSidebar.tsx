"use client";

import { X, Minus, Plus, ShoppingBag, Trash2, Tag, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function CartSidebar() {
  const t = useTranslations('cart');
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartTotal,
    cartTotalWithCombos,
    cartCount,
    comboSavings,
    comboUpsells,
    appliedCombos,
  } = useCart();

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#f5f3e8] shadow-2xl z-[9999] transform transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl text-gray-900">
                {t('title')}
                {cartCount > 0 && (
                  <span className="ml-2 text-lg text-gray-600">({cartCount})</span>
                )}
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-200/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">{t('empty')}</h3>
                <p className="text-gray-600 mb-6">
                  {t('emptyMessage')}
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all shadow-lg"
                >
                  {t('toMenu')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const isWeightBased = !!item.weightInGrams;
                  const isPieceBased = !item.weightInGrams && !!item.pieces;
                  const controlValue = isPieceBased ? item.pieces! : item.quantity;
                  const unitPrice = isPieceBased && item.pieces
                    ? item.price / item.pieces
                    : isWeightBased && item.weightInGrams
                      ? (item.pricePer100g ?? item.price / (item.weightInGrams / 100))
                      : item.price;

                  return (
                  <div
                    key={item.cartItemId || item.id}
                    className="bg-white/80 rounded-xl p-4 shadow-md border border-gray-100"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 mb-1 truncate">{item.name}</h3>
                        {item.weightInGrams ? (
                          <p className="text-xs text-green-700 font-medium mb-1">
                            {item.weightInGrams} {t('grams')}
                          </p>
                        ) : null}
                        <p className="text-sm text-gray-600 mb-2">
                          €{unitPrice.toFixed(2)}{isWeightBased ? ` / ${t('per100g')}` : ""}
                        </p>

                        {/* Quantity Controls — only for per-piece items */}
                        <div className="flex items-center justify-between">
                          {!item.weightInGrams ? (
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.cartItemId || item.id, controlValue - 1)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <Minus className="w-4 h-4 text-gray-700" />
                              </button>
                              <span className="w-8 text-center text-gray-900">
                                {controlValue}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.cartItemId || item.id, controlValue + 1)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <Plus className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}

                          <button
                            onClick={() => removeFromCart(item.cartItemId || item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('subtotal')}:</span>
                      <span className="text-gray-900">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
                })}
                {/* Upsell nudges */}
                {comboUpsells.map((upsell) => (
                  <div
                    key={upsell.key}
                    className="flex items-center gap-3 bg-[#FFF44F]/60 border border-[#FFF44F] rounded-xl px-4 py-3"
                  >
                    <Tag className="w-4 h-4 text-yellow-700 flex-shrink-0" />
                    <p className="text-sm text-yellow-900 flex-1">
                      {t('comboUpsell', {
                        needed: upsell.needed,
                        name: t(upsell.key === 'borek' ? 'comboNameBorek' : 'comboNameRolle'),
                        price: upsell.comboPrice.toFixed(2),
                      })}
                    </p>
                    <Link
                      href="/products"
                      onClick={() => setIsCartOpen(false)}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4 text-yellow-700" />
                    </Link>
                  </div>
                ))}

                {/* Active combo savings */}
                {appliedCombos.map((combo) => (
                  <div
                    key={combo.productId}
                    className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
                  >
                    <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">
                        {t('comboAppliedLabel', {
                          bundleSize: 3,
                          name: t(combo.key === 'borek' ? 'comboNameBorek' : 'comboNameRolle'),
                        })}
                        {combo.comboCount > 1 && ` ×${combo.comboCount}`}
                      </p>
                      <p className="text-xs text-green-700">
                        {t('comboSavingsLine', { amount: combo.totalSavings.toFixed(2) })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      −€{combo.totalSavings.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Total & Checkout */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-white/60 backdrop-blur-sm">
              {comboSavings > 0 ? (
                <div className="mb-4 pb-4 border-b border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{t('subtotal')}</span>
                    <span>€{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-700">
                    <span>{t('comboDiscount')}</span>
                    <span>−€{comboSavings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-gray-900">{t('total')}:</span>
                    <span className="text-gray-900">€{cartTotalWithCombos.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-lg text-gray-900">{t('total')}:</span>
                  <span className="text-2xl text-gray-900">€{cartTotal.toFixed(2)}</span>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className={`block w-full py-4 text-white text-center rounded-xl transition-all shadow-lg hover:shadow-xl 
                   bg-green-600 hover:bg-green-700`}
              >
                {t('checkout')}
              </Link>

              {/* Continue Shopping */}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full mt-3 py-3 text-gray-700 text-center hover:text-gray-900 transition-colors"
              >
                {t('continueShopping')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
