"use client";

import { Plus, Scale } from "lucide-react";
import { Product } from "@/app/data/ProductList";
import DropdownList, { DropdownOption } from "./DropdownList";

// Generate weight options from 100g to 1kg in 50g steps
const weightOptions: DropdownOption[] = Array.from({ length: 19 }, (_, i) => {
  const grams = 100 + i * 50;
  return {
    value: grams.toString(),
    label: grams >= 1000 ? `${grams / 1000} kg` : `${grams}g`,
  };
});

interface ProductCardProps {
  product: Product;
  weight: string;
  onWeightChange: (productId: string, value: string) => void;
  onAddToCart: (product: Product) => void;
  translations: {
    vegan: string;
    ingredients: string;
    weightInGrams: string;
    weightPlaceholder: string;
    addToCart: string;
    pricePerKg: string;
    productName: string;
    productIngredients: string[];
  };
  translatedCategory: string;
}

export default function ProductCard({
  product,
  weight,
  onWeightChange,
  onAddToCart,
  translations,
  translatedCategory,
}: ProductCardProps) {
  const weightNum = parseInt(weight || "0");

  return (
    <div className="bg-white/95 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-t-2xl">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {product.isVegan && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
            🌱 {translations.vegan}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Name and Category */}
        <div className="mb-3">
          <h3 className="text-xl text-gray-900 mb-1">{translations.productName}</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{translatedCategory}</p>
        </div>

        {/* Ingredients */}
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">{translations.ingredients}:</p>
          <div className="flex flex-wrap gap-1">
            {translations.productIngredients.map((ingredient: string, index: number) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>

        {/* Weight Input Section */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">
            {translations.weightInGrams}:
          </label>
          <DropdownList
            value={weight}
            onChange={(value) => onWeightChange(product.id, value)}
            options={weightOptions}
            placeholder={translations.weightPlaceholder}
            icon={Scale}
          />
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!weightNum || weightNum <= 0}
        >
          <Plus className="w-5 h-5" />
          <span>{translations.addToCart}</span>
        </button>

        {/* Price per kg */}
        <p className="text-xs text-gray-400 text-center mt-3">
          {translations.pricePerKg}: €{product.pricePerKg.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
