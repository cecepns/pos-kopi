import React from "react";
import { Search, X } from "lucide-react";

/**
 * Reusable Search Input Component
 * Integrates with debounced search values
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari data...",
  className = "",
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm text-espresso placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-coffee-400 focus:border-coffee-500 transition-all shadow-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
