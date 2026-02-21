"use client";

import { useState } from "react";
import { ShoppingCart, Filter } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from 'next-intl';
import { products, Product } from "@/app/data/ProductList";
import ProductCard from "@/app/components/ProductCard";



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
  const { addToCart } = useCart();
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
    setWeights({ ...weights, [productId]: value });
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
        </div>

        {/* Product Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              weight={weights[product.id] || ""}
              onWeightChange={handleWeightChange}
              onAddToCart={handleAddToCart}
              translations={{
                vegan: t('vegan'),
                ingredients: t('ingredients'),
                weightInGrams: t('weightInGrams'),
                weightPlaceholder: t('weightPlaceholder'),
                addToCart: t('addToCart'),
                pricePerKg: t('pricePerKg'),
                productName: t(`products.${product.id}.name`),
                productIngredients: t.raw(`products.${product.id}.ingredients`) as string[],
              }}
              translatedCategory={getTranslatedCategory(product.category)}
            />
          ))}
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
