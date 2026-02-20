"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Filter } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from 'next-intl';
import { products, Product } from "@/app/data/ProductList";



// Map German category names to translation keys
const categoryKeyMap: Record<string, string> = {
  "Dips & Aufstriche": "dipsAndSpreads",
  "Hauptgerichte": "mainCourses",
  "Salate": "salads",
  "Vorspeisen": "appetizers",
  "Desserts": "desserts",
};

export default function MenuPage() {
  const t = useTranslations('menu');
  const { addToCart, cartCount, setIsCartOpen } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [weights, setWeights] = useState<{ [key: string]: string }>({});

  // Helper to get translated category
  const getTranslatedCategory = (category: string) => {
    const key = categoryKeyMap[category];
    return key ? t(`categories.${key}`) : category;
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleWeightChange = (productId: string, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setWeights({ ...weights, [productId]: numericValue });
  };

  const calculatePrice = (pricePerKg: number, grams: number) => {
    return (pricePerKg * grams) / 1000;
  };

  const handleAddToCart = (product: Product) => {
    const grams = parseInt(weights[product.id] || "0");
    
    if (grams <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    const price = calculatePrice(product.pricePerKg, grams);

    addToCart({
      id: product.id,
      name: t(`products.${product.id}.name`),
      price: price,
      image: product.image,
      category: getTranslatedCategory(product.category),
      weightInGrams: grams,
      pricePerKg: product.pricePerKg,
    });

    // Clear the weight input after adding to cart
    setWeights({ ...weights, [product.id]: "" });
  };

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto pt-[50px]">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-6">
            <ShoppingCart className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">{t('onlineOrder')}</span>
          </div>

          <h1 className="text-5xl lg:text-6xl tracking-tight text-gray-900 mb-6">
            {t('ourMenu')}
          </h1>

          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                }`}
              >
                {category === "all" ? t('all') : getTranslatedCategory(category)}
              </button>
            ))}
          </div>

          {/* Cart Button (Mobile) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="md:hidden relative p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const weight = parseInt(weights[product.id] || "0");
            const calculatedPrice = weight > 0 ? calculatePrice(product.pricePerKg, weight) : 0;

            return (
              <div
                key={product.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.isVegan && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      🌱 {t('vegan')}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  {/* Name and Category */}
                  <div className="mb-3">
                    <h3 className="text-xl text-gray-900 mb-1">{t(`products.${product.id}.name`)}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{getTranslatedCategory(product.category)}</p>
                  </div>

                  {/* Ingredients */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">{t('ingredients')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {(t.raw(`products.${product.id}.ingredients`) as string[]).map((ingredient: string, index: number) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price per kg */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">{t('pricePerKg')}:</span>
                      <span className="text-2xl text-gray-900">
                        €{product.pricePerKg.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Weight Input Section */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('weightInGrams')}:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={weights[product.id] || ""}
                      onChange={(e) => handleWeightChange(product.id, e.target.value)}
                      placeholder={t('weightPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {weight > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        {t('price')}: €{calculatedPrice.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!weight || weight <= 0}
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t('addToCart')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              {t('noProducts')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
