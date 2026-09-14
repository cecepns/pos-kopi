import React from "react";
import { Plus, Coffee } from "lucide-react";
import { formatRupiah } from "../../utils/formatters";
import { getImageUrl } from "../../utils/api";

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div
      onClick={() => onAddToCart(product)}
      className="group relative bg-white rounded-2xl sm:rounded-3xl p-3 border border-amber-100 hover:border-coffee-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Product Image / Icon Banner */}
      <div className="w-full aspect-square rounded-xl sm:rounded-2xl bg-[#fbf8f4] border border-amber-100/70 mb-2.5 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center text-coffee-400 ${
            product.image ? "hidden" : "flex"
          }`}
        >
          <Coffee className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-300" />
        </div>

        {/* Quick Add floating pill */}
        <button
          type="button"
          aria-label={`Tambah ${product.name}`}
          className="absolute bottom-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-coffee-600 text-white flex items-center justify-center shadow-md shadow-coffee-950/20 group-hover:bg-coffee-700 transition-all transform group-hover:scale-110"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block mb-0.5">
            {product.category_name || "Menu Kopi"}
          </span>
          <h4 className="font-bold text-xs sm:text-sm text-espresso line-clamp-2 leading-tight group-hover:text-coffee-700 transition-colors">
            {product.name}
          </h4>
        </div>

        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-100">
          <span className="font-black text-xs sm:text-sm text-coffee-700">
            {formatRupiah(product.price)}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            /{product.unit || "cup"}
          </span>
        </div>
      </div>
    </div>
  );
}
