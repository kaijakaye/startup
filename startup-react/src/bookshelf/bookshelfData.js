export function progressPercent(book = {}) {
  const progress = book.progress;

  if (typeof progress === 'number') {
    return clampPercent(progress);
  }

  if (progress?.unit === 'percent') {
    return clampPercent(progress.current ?? 0);
  }

  // Backend books use pagesRead and totalPages.
  const current = Number(book.pagesRead ?? progress?.current ?? 0);
  const total = Number(book.totalPages ?? progress?.total ?? 0);

  if (total > 0) {
    return clampPercent(Math.round((current / total) * 100));
  }

  return clampPercent(book.progressPercent ?? 0);
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

export function shelfType(shelf = '') {
  const value = String(shelf).toLowerCase().trim().replace(/[-_]/g, ' ');

  if (['reading', 'currently reading'].includes(value)) return 'reading';
  if (['tbr', 'to be read', 'to read'].includes(value)) return 'tbr';
  if (['finished', 'read', 'completed'].includes(value)) return 'finished';

  return value;
}