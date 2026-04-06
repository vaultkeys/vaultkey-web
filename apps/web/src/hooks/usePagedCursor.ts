"use client";

import { useState, useCallback, useRef } from "react";

interface PagedResponse<T> {
  items: T[];
  next_cursor: string | null | undefined;
  has_more: boolean;
}

interface UsePagedCursorOptions<T> {
  /**
   * The fetch function for a single page.
   * Receives the cursor for that page (undefined = first page).
   * Must return { items, next_cursor, has_more }.
   */
  fetcher: (cursor: string | undefined) => Promise<PagedResponse<T>>;
  pageSize?: number;
}

interface UsePagedCursorReturn<T> {
  /** Items for the current page */
  items: T[];
  currentPage: number;
  /** Highest page number fetched so far (1-indexed) */
  totalKnownPages: number;
  hasMore: boolean;
  loading: boolean;
  /** Navigate to a specific page (1-indexed). Fetches if not yet cached. */
  goToPage: (page: number) => Promise<void>;
  /** Convenience wrappers */
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  /** Call this to kick off the first load (replaces your initial load() call) */
  loadFirst: () => Promise<void>;
  /** Reset everything — call when orgId / filters change */
  reset: () => void;
}

export function usePagedCursor<T>({
  fetcher,
}: UsePagedCursorOptions<T>): UsePagedCursorReturn<T> {
  // page data cache: pageData.current[pageIndex] = T[]  (0-indexed internally)
  const pageData = useRef<Map<number, T[]>>(new Map());
  // cursor cache: cursors.current[pageIndex] = cursor needed to fetch that page
  // cursors[0] = undefined (first page needs no cursor)
  const cursors = useRef<Map<number, string | undefined>>(new Map([[0, undefined]]));

  const [currentPage, setCurrentPage] = useState(1); // 1-indexed for UI
  const [totalKnownPages, setTotalKnownPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  // trigger re-render when page data changes
  const [, setTick] = useState(0);

  const rerender = () => setTick((n) => n + 1);

  const fetchPage = useCallback(
    async (pageIndex: number /* 0-indexed */): Promise<boolean> => {
      // Already cached
      if (pageData.current.has(pageIndex)) return true;

      // Cursor for this page must be known
      if (!cursors.current.has(pageIndex)) return false;

      setLoading(true);
      try {
        const cursor = cursors.current.get(pageIndex);
        const res = await fetcher(cursor);

        pageData.current.set(pageIndex, res.items);

        const nextPageIndex = pageIndex + 1;
        // Store cursor for next page if we got one
        if (res.next_cursor) {
          cursors.current.set(nextPageIndex, res.next_cursor);
        }

        const knownPages = pageData.current.size;
        setTotalKnownPages(knownPages);
        setHasMore(res.has_more);
        return true;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  const goToPage = useCallback(
    async (page: number /* 1-indexed */) => {
      const pageIndex = page - 1;
      const ok = await fetchPage(pageIndex);
      if (ok) {
        setCurrentPage(page);
        rerender();
      }
    },
    [fetchPage]
  );

  const loadFirst = useCallback(async () => {
    await fetchPage(0);
    setCurrentPage(1);
    rerender();
  }, [fetchPage]);

  const nextPage = useCallback(async () => {
    await goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(async () => {
    if (currentPage > 1) await goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const reset = useCallback(() => {
    pageData.current = new Map();
    cursors.current = new Map([[0, undefined]]);
    setCurrentPage(1);
    setTotalKnownPages(0);
    setHasMore(false);
    setLoading(false);
    rerender();
  }, []);

  const items = pageData.current.get(currentPage - 1) ?? [];

  return {
    items,
    currentPage,
    totalKnownPages,
    hasMore,
    loading,
    goToPage,
    nextPage,
    prevPage,
    loadFirst,
    reset,
  };
}