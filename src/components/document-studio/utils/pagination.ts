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
 * Calculates physical row height in pixels based on item name character count and line wraps.
 * - Standard 1-line item: ~34px
 * - 2-line item (name > 45 chars): ~48px
 * - 3-4 line kit/description (name > 85 chars): ~66px
 */
export function calculateItemRowHeight(item: LineItem): number {
  const nameLen = (item.name || '').trim().length;
  if (nameLen > 85) return 66; // 3-4 lines
  if (nameLen > 45) return 48; // 2 lines
  return 34; // 1 line standard row
}

// Exact ISO A4 pixel dimensions at 96 DPI
export const A4_TOTAL_HEIGHT = 1123; // px

// Non-item overhead budgets with safety buffers to guarantee footers never clip
// Single Page: Header (~125) + Client (~95) + thead (~32) + Terms/Totals (~185) + Footer (~140) + buffer (~40) = ~617px
export const SINGLE_PAGE_MAX_ITEMS_HEIGHT = 505; // px

// Multi-Page Page 1: Header (~125) + Client (~95) + thead (~32) + Running Footer (~90) + buffer (~40) = ~382px
export const PAGE_1_MAX_ITEMS_HEIGHT = 740; // px

// Multi-Page Middle Pages: Running Header (~60) + thead (~32) + Running Footer (~90) + buffer (~35) = ~217px
export const MIDDLE_PAGE_MAX_ITEMS_HEIGHT = 905; // px

// Multi-Page Last Page: Running Header (~60) + thead (~32) + Terms/Totals (~185) + Signature Footer (~140) + buffer (~35) = ~452px
export const LAST_PAGE_MAX_ITEMS_HEIGHT = 670; // px

/**
 * Dynamic A4 Multi-Page Pagination Algorithm:
 * 1. Checks if all items + terms & totals fit safely within a single A4 page (~505px items budget).
 *    If yes -> returns 1 single page. Zero vacant space, no second page, footer fully visible.
 * 2. If items exceed single-page capacity -> enters multi-page mode.
 *    Page 1 is FILLED FIRST up to its maximum capacity (~740px items budget),
 *    and only the items that overflow past Page 1 spill over to subsequent pages.
 * 3. Terms & Banking Details and Financial Summary Box are rendered strictly on the final page.
 */
export function paginateDocumentItems(items: LineItem[]): PageChunk[] {
  // Edge case: empty document
  if (!items || items.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isFirstPage: true,
        isLastPage: true,
        items: [],
        startIndex: 0
      }
    ];
  }

  const totalItemsHeight = items.reduce((sum, it) => sum + calculateItemRowHeight(it), 0);

  // Scenario 1: All items fit comfortably on a single A4 page
  if (totalItemsHeight <= SINGLE_PAGE_MAX_ITEMS_HEIGHT && items.length <= 8) {
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

  // Scenario 2: Multi-page document. Fill Page 1 first to capacity!
  const rawChunks: { items: LineItem[]; startIndex: number }[] = [];

  // Determine how many items fit on Page 1
  let p1Index = 0;
  let p1CurrentHeight = 0;

  // We want Page 1 to fill greedily, but always leave at least 1-2 items for the final page summary table
  const maxP1Items = Math.max(1, items.length - 1);

  while (p1Index < maxP1Items) {
    const nextItemHeight = calculateItemRowHeight(items[p1Index]);
    if (p1CurrentHeight + nextItemHeight > PAGE_1_MAX_ITEMS_HEIGHT) {
      break;
    }
    p1CurrentHeight += nextItemHeight;
    p1Index++;
  }

  // Guard: Page 1 must have at least 1 item
  p1Index = Math.max(1, p1Index);

  rawChunks.push({
    items: items.slice(0, p1Index),
    startIndex: 0
  });

  let offset = p1Index;

  // Fill subsequent middle pages and last page
  while (offset < items.length) {
    const remainingItems = items.slice(offset);
    const remainingHeight = remainingItems.reduce((sum, it) => sum + calculateItemRowHeight(it), 0);

    // If remaining items fit on the final page with Terms & Totals
    if (remainingHeight <= LAST_PAGE_MAX_ITEMS_HEIGHT) {
      rawChunks.push({
        items: remainingItems,
        startIndex: offset
      });
      break;
    }

    // Otherwise, fill a middle page
    let midIndex = offset;
    let midCurrentHeight = 0;
    const maxMidItems = Math.max(offset + 1, items.length - 1);

    while (midIndex < maxMidItems) {
      const nextHeight = calculateItemRowHeight(items[midIndex]);
      if (midCurrentHeight + nextHeight > MIDDLE_PAGE_MAX_ITEMS_HEIGHT) {
        break;
      }
      midCurrentHeight += nextHeight;
      midIndex++;
    }

    const count = Math.max(1, midIndex - offset);
    rawChunks.push({
      items: items.slice(offset, offset + count),
      startIndex: offset
    });
    offset += count;
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
