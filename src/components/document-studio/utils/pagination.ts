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
  if (nameLen > 80) return 74; // 3-4 lines wrapped description
  if (nameLen > 40) return 54; // 2 lines
  return 38; // 1 line standard row
}

/**
 * Single A4 page capacity:
 * Total A4 height: 1123px.
 * On a single page, we have:
 * - Full Header banner: ~125px
 * - Client & Booking metadata: ~105px
 * - Table header (thead): ~32px
 * - Table margins & paddings: ~20px
 * - Terms & Banking + Financial Summary Box: ~195px
 * - Legal Footer with Digital Signature Slot: ~140px
 * Total non-item overhead = ~617px.
 * Available height for items = 1123 - 617 = 506px.
 * 
 * At ~38px - 40px per row, this comfortably accommodates up to 10 standard items,
 * or 7-9 items with multi-line names, on a SINGLE pristine A4 page.
 */
export const SINGLE_PAGE_ITEMS_HEIGHT_LIMIT = 485;

/**
 * Multi-page Document Page 1 capacity:
 * On Page 1 of a multi-page document, Terms & Totals are deferred to the last page.
 * - Full Header banner: ~125px
 * - Client & Booking metadata: ~105px
 * - Table header: ~32px
 * - Running footer: ~95px
 * - Paddings: ~20px
 * Total non-item overhead = ~377px.
 * Available height for items on Page 1 = 1123 - 377 = 746px.
 * Accommodates up to 14-16 items without awkward vacant gaps.
 */
export const PAGE_1_ITEMS_HEIGHT_LIMIT = 680;

/**
 * Multi-page Document Middle Pages capacity:
 * - Running header: ~60px
 * - Table header: ~32px
 * - Running footer: ~95px
 * - Paddings: ~20px
 * Available height for items = 1123 - 207 = 916px.
 * Accommodates up to 18-20 items.
 */
export const MIDDLE_PAGE_ITEMS_HEIGHT_LIMIT = 820;

/**
 * Multi-page Document Last Page capacity:
 * - Running header: ~60px
 * - Table header: ~32px
 * - Terms & Banking + Financial Summary Box: ~195px
 * - Legal Footer with Digital Signature Slot: ~140px
 * - Paddings: ~20px
 * Total overhead = ~447px.
 * Available height for items on Last Page = 1123 - 447 = 676px.
 * Accommodates up to 12-14 items.
 */
export const LAST_PAGE_ITEMS_HEIGHT_LIMIT = 620;

/**
 * Paginates document line items across A4 pages:
 * 1. If line items fit on a single A4 page (up to 10 standard items), renders all items,
 *    terms & banking, and digital signature on 1 clean, balanced page.
 * 2. If line items exceed A4 single page capacity, items fill Page 1 naturally (up to 12-14 items)
 *    before continuing to subsequent pages, with Terms & Banking and Digital Signature on the final page.
 */
export function paginateDocumentItems(items: LineItem[]): PageChunk[] {
  const totalItemsHeight = items.reduce((sum, it) => sum + estimateItemRowHeight(it), 0);

  // If items fit on a single page, keep everything on Page 1
  if (items.length <= 10 && totalItemsHeight <= SINGLE_PAGE_ITEMS_HEIGHT_LIMIT) {
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

  // When total items fit in 2 pages (up to ~20 items)
  if (items.length <= 20) {
    // Keep at least 3-4 items on the final page so the final page has a meaningful table
    const minLastPageItems = Math.min(4, Math.floor(items.length / 3));
    let p1Count = Math.max(1, items.length - minLastPageItems);

    // Ensure Page 1 does not exceed Page 1 height capacity
    while (p1Count > 1) {
      const p1Height = items.slice(0, p1Count).reduce((sum, it) => sum + estimateItemRowHeight(it), 0);
      if (p1Height <= PAGE_1_ITEMS_HEIGHT_LIMIT) {
        break;
      }
      p1Count--;
    }

    rawChunks.push({
      items: items.slice(0, p1Count),
      startIndex: 0
    });
    rawChunks.push({
      items: items.slice(p1Count),
      startIndex: p1Count
    });
  } else {
    // 3 or more pages (> 20 items):
    // Fill Page 1 up to PAGE_1_ITEMS_HEIGHT_LIMIT
    let p1End = 0;
    let p1H = 0;
    while (p1End < items.length) {
      const h = estimateItemRowHeight(items[p1End]);
      if (p1H + h > PAGE_1_ITEMS_HEIGHT_LIMIT) break;
      p1H += h;
      p1End++;
    }
    p1End = Math.max(1, Math.min(p1End, 14));
    rawChunks.push({
      items: items.slice(0, p1End),
      startIndex: 0
    });

    let offset = p1End;

    // Middle pages & Last page
    while (offset < items.length) {
      const remainingItems = items.slice(offset);
      const remainingHeight = remainingItems.reduce((sum, it) => sum + estimateItemRowHeight(it), 0);

      if (remainingHeight <= LAST_PAGE_ITEMS_HEIGHT_LIMIT) {
        // Fits entirely on the final page
        rawChunks.push({
          items: remainingItems,
          startIndex: offset
        });
        break;
      }

      // Fill a middle page
      let midEnd = offset;
      let midH = 0;
      while (midEnd < items.length) {
        const h = estimateItemRowHeight(items[midEnd]);
        if (midH + h > MIDDLE_PAGE_ITEMS_HEIGHT_LIMIT) break;
        midH += h;
        midEnd++;
      }
      const count = Math.max(1, midEnd - offset);
      rawChunks.push({
        items: items.slice(offset, offset + count),
        startIndex: offset
      });
      offset += count;
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
