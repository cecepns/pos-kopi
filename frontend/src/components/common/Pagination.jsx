import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable Pagination Component
 * Conforms to AGENTS.md Pagination Rules:
 * - default perpage: 10
 * - bisa memilih limit: 10, 25, 50, 100
 * - Previous button
 * - Next button
 * - Pagination number
 * - Active page state
 */
export default function Pagination({
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
}) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-gray-600 border-t border-amber-100/80">
      {/* Items info & limit selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span>Baris:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-espresso font-medium focus:ring-2 focus:ring-coffee-400 focus:border-coffee-500 outline-hidden transition-all shadow-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <span className="text-xs sm:text-sm text-gray-500">
          Menampilkan <span className="font-semibold text-espresso">{startItem}</span> -{" "}
          <span className="font-semibold text-espresso">{endItem}</span> dari{" "}
          <span className="font-semibold text-espresso">{total}</span>
        </span>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous Page"
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-amber-50 hover:text-coffee-600 hover:border-coffee-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">
                ...
              </span>
            );
          }
          const isActive = p === page;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-8 h-8 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "bg-coffee-600 text-white shadow-xs shadow-coffee-200"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-amber-50 hover:text-coffee-600 hover:border-coffee-300"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next Page"
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-amber-50 hover:text-coffee-600 hover:border-coffee-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
