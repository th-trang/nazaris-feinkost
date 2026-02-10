'use client';

import { useCart } from '@/app/context/CartContext';
import { Filter, Plus, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isVegan: boolean;
}

export default function Menu() {
    const t = useTranslations('menu');

    const { addToCart, cartCount, setIsCartOpen } = useCart();
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const categoryKeys: Record<string, string> = {
        "dips": t('categories.dips'),
        "mainCourses": t('categories.mainCourses'),
        "salads": t('categories.salads'),
        "appetizers": t('categories.appetizers'),
        "desserts": t('categories.desserts'),
    };

    const products: Product[] = [
        {
            id: "1",
            name: t('products.hummusClassic.name'),
            description: t('products.hummusClassic.description'),
            price: 4.5,
            image: "https://images.unsplash.com/photo-1759679134771-835a874351fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1tdXMlMjBib3dsJTIwbWVkaXRlcnJhbmVhbnxlbnwxfHx8fDE3NzA0ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["dips"],
            isVegan: true,
        },
        {
            id: "2",
            name: t('products.falafelPlate.name'),
            description: t('products.falafelPlate.description'),
            price: 7.9,
            image: "https://images.unsplash.com/photo-1550936831-46af2497cf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWxhZmVsJTIwcGxhdGUlMjB2ZWdhbnxlbnwxfHx8fDE3NzA0ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["mainCourses"],
            isVegan: true,
        },
        {
            id: "3",
            name: t('products.greekSalad.name'),
            description: t('products.greekSalad.description'),
            price: 6.5,
            image: "https://images.unsplash.com/photo-1625944525991-c196b2813492?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlayUyMHNhbGFkJTIwZnJlc2h8ZW58MXx8fHwxNzcwNDY2ODAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["salads"],
            isVegan: false,
        },
        {
            id: "4",
            name: t('products.dolma.name'),
            description: t('products.dolma.description'),
            price: 5.9,
            image: "https://images.unsplash.com/photo-1621953723422-6023013f659d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2xtYSUyMHN0dWZmZWQlMjBncmFwZSUyMGxlYXZlc3xlbnwxfHx8fDE3NzA0ODUyMzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["appetizers"],
            isVegan: true,
        },
        {
            id: "5",
            name: t('products.tabouleh.name'),
            description: t('products.tabouleh.description'),
            price: 5.5,
            image: "https://images.unsplash.com/photo-1542528180-0c79567c66de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJvdWxlaCUyMHNhbGFkJTIwcGFyc2xleXxlbnwxfHx8fDE3NzA0ODUyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["salads"],
            isVegan: true,
        },
        {
            id: "6",
            name: t('products.baklava.name'),
            description: t('products.baklava.description'),
            price: 3.9,
            image: "https://images.unsplash.com/photo-1767796777227-32ef3200fab8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtsYXZhJTIwcGFzdHJ5JTIwZGVzc2VydHxlbnwxfHx8fDE3NzAzODY4NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["desserts"],
            isVegan: false,
        },
        {
            id: "7",
            name: t('products.tzatziki.name'),
            description: t('products.tzatziki.description'),
            price: 3.9,
            image: "https://images.unsplash.com/photo-1709620061649-b352f63ea4cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0emF0emlraSUyMHlvZ3VydCUyMGRpcHxlbnwxfHx8fDE3NzA0ODUyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["dips"],
            isVegan: false,
        },
        {
            id: "8",
            name: t('products.marinatedOlives.name'),
            description: t('products.marinatedOlives.description'),
            price: 4.2,
            image: "https://images.unsplash.com/photo-1657617836185-c3bceced415f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGl2ZXMlMjBtYXJpbmF0ZWQlMjBib3dsfGVufDF8fHx8MTc3MDQ4NTI0M3ww&ixlib=rb-4.1.0&q=80&w=1080",
            category: categoryKeys["appetizers"],
            isVegan: true,
        },
    ];

    const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

    const filteredProducts =
        selectedCategory === "all"
            ? products
            : products.filter((p) => p.category === selectedCategory);

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
        });
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
                {category === "all" ? t('all') : category}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {product.isVegan && (
                  <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                    🌱 {t('vegan')}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl text-gray-900">
                    €{product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">{t('add')}</span>
                  </button>
                </div>
              </div>
            </div>
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