import React from "react";

export default function LoadingSkeleton({ type = "table", rows = 5 }) {
  if (type === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
            <div className="h-4 bg-gray-200 rounded-md w-24 mb-3" />
            <div className="h-7 bg-gray-300 rounded-md w-36 mb-2" />
            <div className="h-3 bg-gray-200 rounded-md w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-amber-50 rounded-xl mb-3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded-md w-12" />
          <div className="h-5 bg-gray-200 rounded-md flex-1" />
          <div className="h-5 bg-gray-200 rounded-md w-28" />
          <div className="h-5 bg-gray-200 rounded-md w-20" />
        </div>
      ))}
    </div>
  );
}
