import React from "react";

export default function Badge({ variant = "default", children, className = "" }) {
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    coffee: "bg-amber-100/70 text-coffee-800 border-amber-300/80",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${selectedVariant} ${className}`}
    >
      {children}
    </span>
  );
}
