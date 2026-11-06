import { LineItem } from '../types';

export interface PageChunk {
  pageNumber: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  items: LineItem[];
  startIndex: number;
}

/**
 * Paginates document line items across A4 pages.
 * - Single page: <= 5 items comfortably accommodates full header, client details, items,
 *   terms & bank details, financial summary, and signature stamp.
 * - Multi-page (> 5 items):
 *   - Page 1: Full Header, Client & Dispatch info, Table (up to 8 items), Running Footer.
 *   - Middle Pages (if 3+): Compact Running Header, Table (up to 12 items), Running Footer.
 *   - Final Page: Compact Running Header, Table (remaining items, up to 6),
 *     Terms & Banking Details, Financial Summary, Legal Footer + Digital Signature Stamp.
 */
export function paginateDocumentItems(items: LineItem[]): PageChunk[] {
  // If no items or up to 5 items, fit on single pristine A4 page
  if (items.length <= 5) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isFirstPage: true,
        isLastPage: true,
        items,
        startIndex: 0
      }
    ];
  }

  const FIRST_PAGE_MAX = 8;
  const LAST_PAGE_MAX = 6;
  const MIDDLE_PAGE_MAX = 12;

  const rawChunks: { items: LineItem[]; startIndex: number }[] = [];

  // Case: 2 pages (6 to 14 items)
  if (items.length <= FIRST_PAGE_MAX + LAST_PAGE_MAX) {
    // Distribute proportionally so both pages look aesthetically balanced
    const p1Count = Math.min(
      FIRST_PAGE_MAX,
      Math.max(
        items.length - LAST_PAGE_MAX,
        Math.ceil(items.length / 2)
      )
    );

    rawChunks.push({
      items: items.slice(0, p1Count),
      startIndex: 0
    });
    rawChunks.push({
      items: items.slice(p1Count),
      startIndex: p1Count
    });
  } else {
    // Case: 3 or more pages (> 14 items)
    // Page 1 gets up to FIRST_PAGE_MAX
    rawChunks.push({
      items: items.slice(0, FIRST_PAGE_MAX),
      startIndex: 0
    });

    let offset = FIRST_PAGE_MAX;

    while (offset < items.length) {
      const remaining = items.length - offset;

      if (remaining <= LAST_PAGE_MAX) {
        // Fits entirely on the final page
        rawChunks.push({
          items: items.slice(offset),
          startIndex: offset
        });
        break;
      }

      if (remaining <= MIDDLE_PAGE_MAX + LAST_PAGE_MAX) {
        // Exactly one middle page and one last page left
        const midCount = Math.min(
          MIDDLE_PAGE_MAX,
          Math.max(remaining - LAST_PAGE_MAX, Math.ceil(remaining / 2))
        );
        rawChunks.push({
          items: items.slice(offset, offset + midCount),
          startIndex: offset
        });
        offset += midCount;
        rawChunks.push({
          items: items.slice(offset),
          startIndex: offset
        });
        break;
      }

      // More than 2 pages remaining, consume a full middle page
      rawChunks.push({
        items: items.slice(offset, offset + MIDDLE_PAGE_MAX),
        startIndex: offset
      });
      offset += MIDDLE_PAGE_MAX;
    }
  }

  const totalPages = rawChunks.length;
  return rawChunks.map((chunk, index) => ({
    pageNumber: index + 1,
    totalPages,
    isFirstPage: index === 0,
    isLastPage: index === totalPages - 1,
    items: chunk.items,
    startIndex: chunk.startIndex
  }));
}
