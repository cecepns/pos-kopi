import { useState } from "react";

/**
 * usePagination Hook
 * Standardizes server-side pagination state conforming to AGENTS.md rules:
 * - default perpage: 10
 * - can choose limit: 10, 25, 50, 100
 */
export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const updatePaginationMeta = (pagination) => {
    if (!pagination) return;
    if (pagination.page !== undefined) setPage(pagination.page);
    if (pagination.limit !== undefined) setLimit(pagination.limit);
    if (pagination.total !== undefined) setTotal(pagination.total);
    if (pagination.totalPages !== undefined) setTotalPages(pagination.totalPages);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(Number(newLimit));
    setPage(1); // Reset to page 1 on limit change
  };

  return {
    page,
    limit,
    total,
    totalPages,
    setPage: handlePageChange,
    setLimit: handleLimitChange,
    updatePaginationMeta,
  };
}
