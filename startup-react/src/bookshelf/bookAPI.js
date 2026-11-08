export async function lookupBook(title, typedAuthor = '') {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error('Enter a book title.');
  }

  const params = new URLSearchParams({
    title: cleanTitle,
    author: typedAuthor.trim(),
  });

  const response = await fetch(`/api/books/search?${params}`, {
    credentials: 'include',
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.msg ||
        result.message ||
        `Book search failed: ${response.status}`
    );
  }

  return result.book;
}

export async function searchBooks(title, typedAuthor = '') {
  const book = await lookupBook(title, typedAuthor);
  return book ? [book] : [];
}