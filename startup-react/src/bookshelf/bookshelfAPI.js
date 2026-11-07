const booksUrl = '/api/books';

async function sendRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new Error(problem.msg || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getBooks() {
  return sendRequest(booksUrl);
}

export function createBook(book) {
  return sendRequest(booksUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
}

export function updateBook(id, changes) {
  return sendRequest(`${booksUrl}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}