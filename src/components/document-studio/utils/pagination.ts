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
  if (nameLen > 80) return 76; // 3-4 lines wrapped description
  if (nameLen > 40) return 54; // 2 lines
  return 38; // 1 line standard row
}

/**
 * Safe Single A4 page capacity:
 * To guarantee the bottom footer (legal division + digital signature slot) is NEVER
 * cut off or "drained" beyond the 1123px A4 boundary, a single page can hold up to 4 standard items
 * (or 5 very short items without descriptions).
 * 
 * Once line items exceed this capacity (e.g. 6 items or items with long descriptions),
 * the document cleanly paginates to a new A4 page.
 */
export const SINGLE_PAGE_ITEMS_HEIGHT_LIMIT = 210;
export const SINGLE_PAGE_MAX_ITEMS = 4;

/**
 * Paginates document line items across A4 pages:
 * - Single page: <= 4 items (or 5 short items) fitting safely without clipping the footer.
 * - Multi-page (> 4-5 items):
 *   - Page 1: Full Header, Client & Dispatch info, Table (up to 4-7 items depending on height), Running Footer.
 *   - Final Page: Running Header, remaining items, Terms & Banking Details, Financial Summary,
 *     Legal Footer with Digital Signature Slot.
 */
export function paginateDocumentItems(items: LineItem[]): PageChunk[] {
  const totalItemsHeight = items.reduce((sum, it) => sum + estimateItemRowHeight(it), 0);

  // If 4 or fewer items and cumulative height is within safe single-page limit:
  const canFitSinglePage = (items.length <= SINGLE_PAGE_MAX_ITEMS && totalItemsHeight <= 250) ||
                           (items.length === 5 && totalItemsHeight <= SINGLE_PAGE_ITEMS_HEIGHT_LIMIT);

  if (canFitSinglePage) {
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

  // Multi-page document
  const rawChunks: { items: LineItem[]; startIndex: number }[] = [];

  // When total items fit in 2 pages (up to 14 items):
  if (items.length <= 14) {
    // For 6 items: Page 1 gets 4 items, Page 2 gets 2 items.
    // For 7 items: Page 1 gets 4 items, Page 2 gets 3 items.
    // For 8 items: Page 1 gets 5 items, Page 2 gets 3 items.
    // For 9 items: Page 1 gets 5 items, Page 2 gets 4 items.
    // For 10 items: Page 1 gets 6 items, Page 2 gets 4 items.
    const p2Count = Math.max(2, Math.min(4, Math.floor(items.length / 2)));
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
    // 3 or more pages (> 14 items):
    // Page 1 gets up to 8 items
    const p1Count = 8;
    rawChunks.push({
      items: items.slice(0, p1Count),
      startIndex: 0
    });

    let offset = p1Count;
    const LAST_PAGE_MAX = 5;
    const MIDDLE_PAGE_MAX = 10;

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
