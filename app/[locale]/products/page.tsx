"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from 'next-intl';
import { Product } from "@/app/data/ProductList";
import { fetchAllProducts } from "@/app/lib/firebase/products";
import ProductCard from "@/app/components/ProductCard";
import ProductFilterPanel, { ProductFilters, DEFAULT_FILTERS } from "@/app/components/ProductFilterPanel";
import { filterProducts } from "./filterProduct";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const t = useTranslations('products');
  const { addToCart } = useCart();
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [weights, setWeights] = useState<{ [key: string]: string }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAllProducts()
      .then((data) => {
        // console.log('[products] fetched:', data.length, data);
        setProducts(data);
      })
      .catch((err) => {
        console.error('[products] fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Helper to get displayed category label
  const getTranslatedCategory = (categoryName: string) => categoryName;

  const categoryIdToName = Object.fromEntries(
    products.map((p) => [p.categoryId, p.categoryName]),
  );
  const uniqueCategoryIds = Array.from(new Set(products.map((p) => p.categoryId)));

  const categoryOptions = [
    { value: "all", label: t("filter.allCategories") },
    ...uniqueCategoryIds.map((id) => ({ value: id, label: categoryIdToName[id] || id })),
  ];

  const filteredProducts = filterProducts(products, filters);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleWeightChange = (productId: string, value: string) => {
    setWeights({ ...weights, [productId]: value });
  };

  const calculatePrice = (product: Product, quantity: number) => {
    if (product.priceUnit === "100g") {
      return (quantity / 100) * product.price;
    }
    // per piece: price × number of pieces
    return product.price * quantity;
  };

  const handleAddToCart = (product: Product) => {
    const quantity = parseInt(weights[product.id] || "0");

    if (quantity <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    const price = calculatePrice(product, quantity);

    addToCart({
      id: product.id,
      name: product.name,
      price: price,
      image: product.imageUrl ?? "",
      category: getTranslatedCategory(product.categoryName),
      weightInGrams: product.priceUnit === "100g" ? quantity : 0,
      pieces: product.priceUnit !== "100g" ? quantity : undefined,
      pricePerKg: product.priceUnit === "100g" ? product.price * 10 : product.price,
    });

    // Clear the input after adding to cart
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Product Grid */}
        {!loading && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
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
                    quantityInPieces: t('quantityInPieces'),
                    quantityPlaceholder: t('quantityPlaceholder'),
                    addToCart: t('addToCart'),
                    spicy: t('spicy'),
                    mildlySpicy: t('mildlySpicy'),
                    notSpicy: t('notSpicy'),
                    withGarlic: t('withGarlic'),
                    littleGarlic: t('littleGarlic'),
                    noGarlic: t('noGarlic'),
                    pricePer100g: t('pricePer100g'),
                    pricePerPiece: t('pricePerPiece'),
                    pieces: t('pieces'),
                  }}
                  translatedCategory={getTranslatedCategory(product.categoryName)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
