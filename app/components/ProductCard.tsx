"use client";

import { Clock, Flame, Plus, Scale } from "lucide-react";
import { useParams } from "next/navigation";
import { Product } from "@/app/data/ProductList";
import DropdownList, { DropdownOption } from "./DropdownList";
import { getMhdLabel } from "@/app/[locale]/products/filterProduct";

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
    quantityInPieces: string;
    quantityPlaceholder: string;
    addToCart: string;
    spicy: string;
    mildlySpicy: string;
    notSpicy: string;
    withGarlic: string;
    littleGarlic: string;
    noGarlic: string;
    pricePer100g: string;
    pricePerPiece: string;
    pieces: string;
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
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "de";
  const stueckOptions: DropdownOption[] = Array.from({ length: 20 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} ${translations.pieces}`,
  }));
  const weightNum = parseInt(weight || "0");
  const spiceLevel = product.filters?.spiceLevel ?? 0;
  const knoblauch = product.filters?.knoblauch ?? 0;
  const isVegan = product.filters?.dietType === "vegan";
  const mhdLabel = getMhdLabel(product.mhd ?? null, locale);
  const spicyLabel = spiceLevel === 2 ? translations.spicy : spiceLevel === 1 ? translations.mildlySpicy : translations.notSpicy;
  const garlicLabel = knoblauch === 2 ? translations.withGarlic : knoblauch === 1 ? translations.littleGarlic : translations.noGarlic;
  const priceLabel = product.priceUnit === "100g"
    ? `${translations.pricePer100g}: €${product.price.toFixed(2)}`
    : `${translations.pricePerPiece}: €${product.price.toFixed(2)}`;
  const displayName = product.nameTranslations?.[locale] || product.name;
  const displayDescription = product.descriptionTranslations?.[locale] || product.description;
  const displayCategory = product.categoryNameTranslations?.[locale] || translatedCategory;

  return (
    <div className="bg-white/95 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-t-2xl">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-sm">{displayName}</span>
          </div>
        )}
        {isVegan && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
            🌱 {translations.vegan}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Name and Category */}
        <div className="mb-3">
          <h3 className="text-xl text-gray-900 mb-1">{displayName}</h3>
          <p className="text-sm text-gray-600 mb-1">{displayDescription}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {displayCategory}
          </p>
        </div>

        {/* Product Properties */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Flame
              className={`w-4 h-4 ${spiceLevel === 2 ? "text-red-500" : spiceLevel === 1 ? "text-orange-500" : "text-gray-400"}`}
            />
            <span className="text-gray-700">
              {spicyLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">
              {garlicLabel}
            </span>
          </div>
          {mhdLabel && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">MHD:</span>
              <span className="text-gray-700 font-medium">{mhdLabel}</span>
            </div>
          )}
        </div>

        {/* Ingredients */}
        {product.ingredients?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">
              {translations.ingredients}:
            </p>
            <div className="flex flex-wrap gap-1">
              {product.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {ingredient.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weight / Quantity Input Section */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">
            {product.priceUnit === "stueck"
              ? translations.quantityInPieces
              : translations.weightInGrams}:
          </label>
          <DropdownList
            value={weight}
            onChange={(value) => onWeightChange(product.id, value)}
            options={product.priceUnit === "stueck" ? stueckOptions : weightOptions}
            placeholder={
              product.priceUnit === "stueck"
                ? translations.quantityPlaceholder
                : translations.weightPlaceholder
            }
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

        {/* Price label */}
        <p className="text-xs text-gray-400 text-center mt-3">
          {priceLabel}
        </p>
      </div>
    </div>
  );
}
