import { PageSize, PageDimensions } from './pdfExportTypes';

const DPI = 96;

export function getPageSize(
  pageSize: PageSize | PageDimensions,
): string | { width: number; height: number } {
  if (typeof pageSize === 'string') {
    return pageSize;
  }

  if (
    !pageSize ||
    typeof pageSize !== 'object' ||
    typeof pageSize.width !== 'number' ||
    typeof pageSize.height !== 'number'
  ) {
    throw new Error('Invalid page dimensions');
  }

  return {
    width: pageSize.width / DPI,
    height: pageSize.height / DPI,
  };
}
