"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { ChevronDown, Check, LucideIcon } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: LucideIcon;
  headerTitle?: string;
  renderSelectedValue?: (option: DropdownOption) => ReactNode;
  renderOption?: (option: DropdownOption, isSelected: boolean) => ReactNode;
}

export default function DropdownList({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  icon: Icon,
  headerTitle,
  renderSelectedValue,
  renderOption,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const defaultRenderSelectedValue = (option: DropdownOption) => (
    <div className="flex flex-col">
      <span className="text-gray-900 text-sm font-medium">{option.label}</span>
      {option.description && (
        <span className="text-gray-500 text-xs">{option.description}</span>
      )}
    </div>
  );

  const defaultRenderOption = (option: DropdownOption, isSelected: boolean) => (
    <>
      <div className="flex items-center space-x-3">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5" />}
        </div>
        <div className="flex flex-col">
          <span
            className={`text-sm font-medium ${
              isSelected ? "text-green-700" : "text-gray-700"
            }`}
          >
            {option.label}
          </span>
          {option.description && (
            <span className="text-xs text-gray-500">{option.description}</span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div ref={containerRef} className={`relative ${isOpen ? "z-50" : ""}`}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Icon className="w-4 h-4 text-green-600" />
            </div>
          )}
          {selectedOption ? (
            renderSelectedValue
              ? renderSelectedValue(selectedOption)
              : defaultRenderSelectedValue(selectedOption)
          ) : (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Options List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${
                    isSelected ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  {renderOption
                    ? renderOption(option, isSelected)
                    : defaultRenderOption(option, isSelected)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
