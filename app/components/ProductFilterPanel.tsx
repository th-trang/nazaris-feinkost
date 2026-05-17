"use client";

import { SlidersHorizontal, X } from "lucide-react";
import DropdownList from "./DropdownList";

export interface ProductFilters {
  category: string;
  spice: string;
  garlic: string;
  diet: string;
  availability: string;
}

export const DEFAULT_FILTERS: ProductFilters = {
  category: "all",
  spice: "all",
  garlic: "all",
  diet: "all",
  availability: "all",
};

export function isDefaultFilters(filters: ProductFilters): boolean {
  return (
    filters.category === "all" &&
    filters.spice === "all" &&
    filters.garlic === "all" &&
    filters.diet === "all" &&
    filters.availability === "all"
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isActive: boolean;
}

function FilterSelect({ label, value, onChange, options, isActive }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`text-[11px] font-semibold tracking-widest uppercase transition-colors ${
          isActive ? "text-green-700" : "text-stone-500"
        }`}
      >
        {label}
      </label>
      <DropdownList
        value={value}
        onChange={onChange}
        options={options}
        renderSelectedValue={(opt) => (
          <span className={`text-sm font-medium ${
            isActive ? "text-green-700" : "text-gray-900"
          }`}>
            {opt.label}
          </span>
        )}
      />
    </div>
  );
}

export interface FilterTranslations {
  showFilter: string;
  hideFilter: string;
  title: string;
  reset: string;
  category: string;
  allCategories: string;
  spice: string;
  all: string;
  spicy: string;
  mild: string;
  garlic: string;
  withGarlic: string;
  withoutGarlic: string;
  diet: string;
  vegan: string;
  notVegan: string;
  availability: string;
  available: string;
  notAvailable: string;
}

interface ProductFilterPanelProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categoryOptions: { value: string; label: string }[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  translations: FilterTranslations;
}

export default function ProductFilterPanel({
  filters,
  onFiltersChange,
  categoryOptions,
  isVisible,
  onToggleVisibility,
  translations: t,
}: ProductFilterPanelProps) {
  const isDefault = isDefaultFilters(filters);

  const spiceOptions = [
    { value: "all", label: t.all },
    { value: "spicy", label: t.spicy },
    { value: "mild", label: t.mild },
  ];

  const garlicOptions = [
    { value: "all", label: t.all },
    { value: "withGarlic", label: t.withGarlic },
    { value: "withoutGarlic", label: t.withoutGarlic },
  ];

  const dietOptions = [
    { value: "all", label: t.all },
    { value: "vegan", label: t.vegan },
    { value: "notVegan", label: t.notVegan },
  ];

  const availabilityOptions = [
    { value: "all", label: t.all },
    { value: "available", label: t.available },
    { value: "notAvailable", label: t.notAvailable },
  ];

  const activeFilterCount = [
    filters.category !== "all",
    filters.spice !== "all",
    filters.garlic !== "all",
    filters.diet !== "all",
    filters.availability !== "all",
  ].filter(Boolean).length;

  return (
    <div className="mb-8">
      {/* Toggle Button */}
      <button
        onClick={onToggleVisibility}
        className={`group flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all shadow-sm ${
          isVisible
            ? "bg-[#FDF5E6] border-[#C4B49A] text-stone-700 hover:border-[#A8956C]"
            : "bg-white border-[#DDD0B8] text-stone-600 hover:bg-[#FAF7F2] hover:border-[#C4B49A]"
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-green-700 transition-transform duration-300 group-hover:rotate-12" />
        {isVisible ? t.hideFilter : t.showFilter}
        {activeFilterCount > 0 && !isVisible && (
          <span className="inline-flex items-center justify-center w-4 h-4 bg-green-600 text-white text-[10px] rounded-full font-bold leading-none">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isVisible && (
        <div className="mt-3 bg-[#FDF5E6] border border-[#E2D9C8] rounded-2xl p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="block w-0.5 h-4 rounded-full bg-gradient-to-b from-green-600 to-green-400" />
              <h3 className="text-sm font-semibold text-stone-800 tracking-wide">{t.title}</h3>
            </div>
            {!isDefault && (
              <button
                onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                className="flex items-center gap-1.5 text-xs text-[#A0522D] hover:text-[#7A3B18] transition-colors font-medium"
              >
                <X className="w-3 h-3" />
                {t.reset}
              </button>
            )}
          </div>

          {/* First row: 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <FilterSelect
              label={t.category}
              value={filters.category}
              onChange={(v) => onFiltersChange({ ...filters, category: v })}
              options={categoryOptions}
              isActive={filters.category !== "all"}
            />
            <FilterSelect
              label={t.spice}
              value={filters.spice}
              onChange={(v) => onFiltersChange({ ...filters, spice: v })}
              options={spiceOptions}
              isActive={filters.spice !== "all"}
            />
            <FilterSelect
              label={t.garlic}
              value={filters.garlic}
              onChange={(v) => onFiltersChange({ ...filters, garlic: v })}
              options={garlicOptions}
              isActive={filters.garlic !== "all"}
            />
          </div>

          {/* Second row: 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FilterSelect
              label={t.diet}
              value={filters.diet}
              onChange={(v) => onFiltersChange({ ...filters, diet: v })}
              options={dietOptions}
              isActive={filters.diet !== "all"}
            />
            <FilterSelect
              label={t.availability}
              value={filters.availability}
              onChange={(v) => onFiltersChange({ ...filters, availability: v })}
              options={availabilityOptions}
              isActive={filters.availability !== "all"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
