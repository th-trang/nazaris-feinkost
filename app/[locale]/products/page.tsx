"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from 'next-intl';
import { products, Product } from "@/app/data/ProductList";
import ProductCard from "@/app/components/ProductCard";
import ProductFilterPanel, { ProductFilters, DEFAULT_FILTERS } from "@/app/components/ProductFilterPanel";
import { filterProducts, categoryKeyMap } from "./filterProduct";



export default function ProductsPage() {
  const t = useTranslations('products');
  const { addToCart } = useCart();
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [weights, setWeights] = useState<{ [key: string]: string }>({});

  // Helper to get translated category
  const getTranslatedCategory = (category: string) => {
    const key = categoryKeyMap[category];
    return key ? t(`categories.${key}`) : category;
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const categoryOptions = categories.map((c) => ({
    value: c,
    label: c === "all" ? t("filter.allCategories") : getTranslatedCategory(c),
  }));

  const filteredProducts = filterProducts(products, filters);

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
            {t('ourProducts')}
          </h1>

          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Filter Panel */}
        <ProductFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          categoryOptions={categoryOptions}
          isVisible={isFilterVisible}
          onToggleVisibility={() => setIsFilterVisible((v) => !v)}
          translations={{
            showFilter: t('filter.showFilter'),
            hideFilter: t('filter.hideFilter'),
            title: t('filter.title'),
            reset: t('filter.reset'),
            category: t('filter.category'),
            allCategories: t('filter.allCategories'),
            spice: t('filter.spice'),
            all: t('filter.all'),
            spicy: t('filter.spicy'),
            mild: t('filter.mild'),
            garlic: t('filter.garlic'),
            withGarlic: t('filter.withGarlic'),
            withoutGarlic: t('filter.withoutGarlic'),
            diet: t('filter.diet'),
            vegan: t('filter.vegan'),
            notVegan: t('filter.notVegan'),
            availability: t('filter.availability'),
            available: t('filter.available'),
            notAvailable: t('filter.notAvailable'),
          }}
        />

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
