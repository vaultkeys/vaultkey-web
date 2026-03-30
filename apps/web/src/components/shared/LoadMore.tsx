"use client";

import { Loader2 } from "lucide-react";

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** Optional label override. Defaults to "Load more" */
  label?: string;
}

/**
 * Minimal load-more trigger that fits the existing table/card list pages.
 * Only renders when hasMore is true. Shows a spinner while loading.
 */
export function LoadMore({ hasMore, loading, onLoadMore, label = "Load more" }: LoadMoreProps) {
  if (!hasMore && !loading) return null;

  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}