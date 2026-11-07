export async function searchBooks(title, author = '') {
  const search = [
    `intitle:${title.trim()}`,
    author.trim() && `inauthor:${author.trim()}`,
  ]
    .filter(Boolean)
    .join(' ');

  const params = new URLSearchParams({
    q: search,
    maxResults: '10',
    printType: 'books',
  });

  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Books API key is missing from .env.local');
  }
  params.set('key', apiKey);

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params}`
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || `Google Books returned ${response.status}`);
  }

  return (data.items ?? []).map(({ id, volumeInfo = {} }) => ({
    googleBooksId: id,
    title: volumeInfo.title ?? 'Untitled',
    author: volumeInfo.authors?.join(', ') ?? 'Unknown author',
    coverUrl: volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:') ?? '',
    totalPages: volumeInfo.pageCount ?? null,
  }));
}