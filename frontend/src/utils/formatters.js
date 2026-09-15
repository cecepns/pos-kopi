/**
 * Formatting utilities
 */

export const formatRupiah = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDateIndo = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatDateTimeIndo = (dateTimeStr) => {
  if (!dateTimeStr) return "-";
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getProductInitials = (name) => {
  if (!name || typeof name !== "string") return "CP";
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CP";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const getProductColorClass = (name) => {
  const palettes = [
    "bg-gradient-to-br from-amber-700 to-amber-950 text-amber-100",
    "bg-gradient-to-br from-[#6f4e37] to-[#362013] text-[#fbf8f4]",
    "bg-gradient-to-br from-stone-700 to-stone-950 text-stone-100",
    "bg-gradient-to-br from-amber-800 to-stone-900 text-amber-50",
    "bg-gradient-to-br from-orange-800 to-amber-950 text-orange-100",
    "bg-gradient-to-br from-yellow-800 to-stone-950 text-yellow-100",
  ];
  if (!name) return palettes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
};
