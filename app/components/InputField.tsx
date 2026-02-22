"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "password" | "number";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
}

export default function InputField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  error,
  icon: Icon,
}: InputFieldProps) {
  const hasIcon = !!Icon;
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-700 mb-2">
        {label}{required && " *"}
      </label>
      <div className={hasIcon ? "relative" : undefined}>
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${hasIcon ? 'pl-12' : 'px-4'} ${hasIcon ? 'pr-4' : ''} py-3 bg-white border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-200'}`}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
