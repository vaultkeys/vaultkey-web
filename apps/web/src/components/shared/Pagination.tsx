"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalKnownPages: number;
  hasMore: boolean;
  loading: boolean;
  onPage: (page: number) => void;
}

/**
 * Numbered pagination for cursor-backed lists.
 *
 * Shows buttons for every page fetched so far.
 * If has_more is true, a ">" arrow lets the user fetch the next page.
 * Going back is always instant (data is cached in usePagedCursor).
 */
export function Pagination({
  currentPage,
  totalKnownPages,
  hasMore,
  loading,
  onPage,
}: PaginationProps) {
  if (totalKnownPages <= 1 && !hasMore) return null;

  const canPrev = currentPage > 1;
  // Can go forward if we're not on the last known page, or if there are more pages to fetch
  const canNext = currentPage < totalKnownPages || hasMore;

  // Build the page number list with ellipsis for long ranges
  const pageNumbers = buildPageNumbers(currentPage, totalKnownPages);

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      {/* Prev arrow */}
      <PageButton
        onClick={() => onPage(currentPage - 1)}
        disabled={!canPrev || loading}
        aria-label="Previous page"
        className="px-2"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </PageButton>

      {/* Numbered pages */}
      {pageNumbers.map((entry, i) =>
        entry === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1 text-xs text-muted-foreground select-none"
          >
            …
          </span>
        ) : (
          <PageButton
            key={entry}
            onClick={() => onPage(entry as number)}
            disabled={loading}
            active={entry === currentPage}
            aria-label={`Page ${entry}`}
            aria-current={entry === currentPage ? "page" : undefined}
          >
            {entry}
          </PageButton>
        )
      )}

      {/* Next arrow — shows spinner when fetching a new page */}
      <PageButton
        onClick={() => onPage(currentPage + 1)}
        disabled={!canNext || loading}
        aria-label="Next page"
        className="px-2"
      >
        {loading && currentPage === totalKnownPages ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </PageButton>
    </div>
  );
}

// ─── internal helpers ────────────────────────────────────────────────────────

type PageEntry = number | "…";

function buildPageNumbers(current: number, total: number): PageEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: PageEntry[] = [];
  const addPage = (n: number) => pages.push(n);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== "…") pages.push("…");
  };

  addPage(1);

  if (current <= 4) {
    for (let i = 2; i <= Math.min(5, total - 1); i++) addPage(i);
    addEllipsis();
  } else if (current >= total - 3) {
    addEllipsis();
    for (let i = Math.max(2, total - 4); i <= total - 1; i++) addPage(i);
  } else {
    addEllipsis();
    for (let i = current - 1; i <= current + 1; i++) addPage(i);
    addEllipsis();
  }

  addPage(total);
  return pages;
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  className,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={cn(
        "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border text-xs font-mono transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}