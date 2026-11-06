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
 * Estimates the vertical pixel height of a table row based on item name length.
 */
export function estimateItemRowHeight(item: LineItem): number {
  const nameLen = (item.name || '').length;
  if (nameLen > 80) return 60; // 3-4 lines wrapped description
  if (nameLen > 40) return 46; // 2 lines
  return 34; // 1 line standard row
}

/**
 * Compact Single A4 page capacity:
 * Total A4 height: 1123px.
 * Non-item overhead (compact Header + Client + thead + Terms & Totals + Footer): ~520px.
 * Available height for items = 1123 - 520 = ~600px.
 * Safe limit for a single page with zero clipping of the footer is 460px (up to 8-9 items).
 */
export const SINGLE_PAGE_ITEMS_HEIGHT_LIMIT = 460;
export const SINGLE_PAGE_MAX_ITEMS = 8;

/**
 * Paginates document line items across A4 pages:
 * 1. If line items fit on the first A4 page (up to 8 items), keeps everything on 1 clean,
 *    unclipped page with no second page and no vacant space.
 * 2. Second page is ONLY created after completely filling the first A4 page.
 *    Page 1 fills first (up to 8-10 items), and only what exceeds it goes onto subsequent pages.
 */
export function paginateDocumentItems(items: LineItem[]): PageChunk[] {
  const totalItemsHeight = items.reduce((sum, it) => sum + estimateItemRowHeight(it), 0);

  // If items fit on the first A4 sheet, keep everything on Page 1
  if (items.length <= SINGLE_PAGE_MAX_ITEMS && totalItemsHeight <= SINGLE_PAGE_ITEMS_HEIGHT_LIMIT) {
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

  // Multi-page document: Page 1 fills first!
  const rawChunks: { items: LineItem[]; startIndex: number }[] = [];

  // When total items fit in 2 pages (up to 16 items):
  if (items.length <= 16) {
    // Fill Page 1 first (takes as many as can fit on Page 1, up to 9-10 items)
    // while keeping at least 2 items on the final page for the terms/totals summary table.
    const p2Count = Math.max(2, Math.min(5, Math.ceil(items.length * 0.35)));
    const p1Count = items.length - p2Count;

    rawChunks.push({
      items: items.slice(0, p1Count),
      startIndex: 0
    });
    rawChunks.push({
      items: items.slice(p1Count),
      startIndex: p1Count
    });
  } else {
    // 3 or more pages (> 16 items):
    // Fill Page 1 up to 10 items
    const p1Count = 10;
    rawChunks.push({
      items: items.slice(0, p1Count),
      startIndex: 0
    });

    let offset = p1Count;
    const LAST_PAGE_MAX = 5;
    const MIDDLE_PAGE_MAX = 12;

    while (offset < items.length) {
      const remaining = items.length - offset;
      if (remaining <= LAST_PAGE_MAX) {
        rawChunks.push({
          items: items.slice(offset),
          startIndex: offset
        });
        break;
      }

      if (remaining <= MIDDLE_PAGE_MAX + LAST_PAGE_MAX) {
        const midCount = Math.min(MIDDLE_PAGE_MAX, Math.ceil(remaining / 2));
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
