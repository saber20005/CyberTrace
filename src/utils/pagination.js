export const LIBRARY_PAGE_SIZE = 9;
export function paginateItems(items, page, pageSize = LIBRARY_PAGE_SIZE) {
  if (!Array.isArray(items)) return { items: [], page: 1, pageCount: 1, total: 0 };
  const size = Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : LIBRARY_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Number.isSafeInteger(page) ? Math.min(Math.max(page, 1), pageCount) : 1;
  return {
    items: items.slice((current - 1) * size, current * size),
    page: current, pageCount, total: items.length,
  };
}
