import { Timestamp } from "firebase/firestore";

export interface ProductIngredient {
  name: string;
  isAllergen: boolean;
  allergenGroup: string;
  order: number;
}

export interface ProductFilters {
  dietType: "vegan" | "veggie" | "dairy";
  knoblauch: 0 | 1 | 2;
  spiceLevel: 0 | 1 | 2;
  containsNuts: boolean;
  containsGluten: boolean;
  texture: "liquid" | "creamy" | "chunky";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  priceUnit: "100g" | "stueck";
  imageUrl: string | null;
  active: boolean;
  ingredients: ProductIngredient[];
  filters: ProductFilters;
  mhd: Timestamp | null;
  availableFrom: string | null;
  availableTo: string | null;
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
  categoryNameTranslations?: Record<string, string>;
}