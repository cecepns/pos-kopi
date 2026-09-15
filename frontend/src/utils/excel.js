import * as XLSX from "xlsx";

/**
 * Reusable utility to export data directly to Microsoft Excel (.xlsx) format
 * @param {Object} options
 * @param {Array<Object>|Array<Array>} options.data - Data array (Array of Objects or Array of Arrays)
 * @param {string} options.filename - Export file name
 * @param {string} [options.sheetName] - Worksheet title
 * @param {Array<number>} [options.columnWidths] - Optional column widths
 */
export function exportToExcel({
  data,
  filename = "laporan",
  sheetName = "Data",
  columnWidths = [],
}) {
  if (!data || data.length === 0) {
    throw new Error("Tidak ada data untuk diekspor ke Excel");
  }

  let worksheet;
  if (Array.isArray(data[0])) {
    worksheet = XLSX.utils.aoa_to_sheet(data);
  } else {
    worksheet = XLSX.utils.json_to_sheet(data);
  }

  // Set column widths if provided or calculate auto widths
  if (columnWidths && columnWidths.length > 0) {
    worksheet["!cols"] = columnWidths.map((w) => ({ wch: w }));
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const finalName = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;

  XLSX.writeFile(workbook, finalName);
}
