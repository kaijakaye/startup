export async function lookupBook(title, typedAuthor = '') {
  const search = [
    `intitle:${title.trim()}`,
    typedAuthor.trim() && `inauthor:${typedAuthor.trim()}`,
  ]
    .filter(Boolean)
    .join(' ');

  const params = new URLSearchParams({ q: search, maxResults: '1' });
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params}`
  );

  if (!response.ok) throw new Error('Book search failed');

  const data = await response.json();
  const volume = data.items?.[0];
  const info = volume?.volumeInfo;

  return {
    googleBooksId: volume?.id ?? null,
    title: info?.title ?? title.trim(),
    author: typedAuthor.trim() || info?.authors?.join(', ') || 'Unknown author',
    coverUrl: info?.imageLinks?.thumbnail?.replace(/^http:/, 'https:') ?? '',
    totalPages: info?.pageCount ?? null,
  };
}