import React, { useState, useEffect } from "react";
import { Coffee, Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "../../utils/api";
import { getProductInitials, getProductColorClass } from "../../utils/formatters";

/**
 * Reusable Product Avatar / Image Component
 * - Displays image if available
 * - Gracefully falls back to Initials Placeholder (e.g. "CH" for Coffee Hitam) or Lucide icon on error/empty
 */
export default function ProductAvatar({
  image,
  name = "Produk",
  size = "md", // "xs", "sm", "md", "lg", "xl", "full"
  mode = "initials", // "initials" | "icon"
  rounded = "rounded-2xl",
  className = "",
  imgClassName = "w-full h-full object-cover",
  alt,
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image src changes
  useEffect(() => {
    setHasError(false);
  }, [image]);

  const initials = getProductInitials(name);
  const colorClass = getProductColorClass(name);

  // Size class map
  const sizeClasses = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm font-black",
    lg: "w-14 h-14 text-base font-black",
    xl: "w-20 h-20 text-xl font-black",
    full: "w-full h-full text-2xl font-black",
  };

  const resolvedSizeClass = sizeClasses[size] || sizeClasses.md;

  const resolvedImageUrl = image
    ? image.startsWith("blob:") || image.startsWith("data:") || image.startsWith("http")
      ? image
      : getImageUrl(image)
    : null;

  return (
    <div
      className={`relative select-none shrink-0 overflow-hidden flex items-center justify-center ${rounded} ${resolvedSizeClass} ${className}`}
    >
      {resolvedImageUrl && !hasError ? (
        <img
          src={resolvedImageUrl}
          alt={alt || name}
          className={`${imgClassName}`}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : mode === "initials" ? (
        <div
          className={`w-full h-full flex items-center justify-center font-black tracking-wider uppercase shadow-inner ${colorClass}`}
          title={name}
        >
          <span>{initials}</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/80 text-coffee-400 border border-amber-100/80">
          <Coffee className="w-1/2 h-1/2 opacity-70" />
        </div>
      )}
    </div>
  );
}
