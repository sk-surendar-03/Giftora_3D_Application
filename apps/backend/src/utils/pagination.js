const MAX_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE = 20

/** Parses `page`/`pageSize` query params into safe, bounded integers. */
export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function buildMeta({ page, pageSize }, total) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
