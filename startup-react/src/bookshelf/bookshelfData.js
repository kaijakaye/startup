import { useEffect, useState } from "react";

function storageKey(userName) {
  return `shelflife:books:${userName.toLowerCase()}`;
}

export function readBooks(userName) {
    if (!userName) { return []; }

    try{
        return JSON.parse(localStorage.getItem(storageKey(userName))) ?? [];
    } catch {
        return [];
    }
}

export function saveBooks(userName, books) {
    if (!userName) { return; }

    localStorage.setItem(storageKey(userName), JSON.stringify(books));
    window.dispatchEvent(new Event('shelflife:books-changed'));
}

export function useBookshelf(userName) {
  const [books, setBooks] = useState(() => readBooks(userName));

  useEffect(() => {
    const refresh = () => setBooks(readBooks(userName));

    refresh();
    window.addEventListener('shelflife:books-changed', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('shelflife:books-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [userName]);

  function updateBooks(nextBooks) {
    setBooks(nextBooks);
    saveBooks(userName, nextBooks);
  }

  return [books, updateBooks];
}

export function progressPercent(book) {
    const progress = book.progress;

    if (typeof progress === 'number') { return progress; }
    if(progress?.unit === 'percent') { return progress.current || 0; }
    if(progress?.total > 0) { return Math.round((progress.current / progress.total) * 100); }

    return book.progressPercent || 0;

}

export function shelfType(shelf = '') {
    const value = shelf.toLowerCase().trim().replace(/[-_]/g, ' ');

    if (value === 'reading' || value === 'currently reading') return 'reading';
    if (value === 'tbr' || value === 'to be read' || value === 'to read') return 'tbr';
    if (value === 'finished' || value === 'read' || value === 'completed') return 'finished';

    return value;
}