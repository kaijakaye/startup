const stubBooks = [
  { title: 'The Night Circus', author: 'Erin Morgenstern' },
];

export async function lookupBook(title, typedAuthor) {
  // Simulates the asynchronous shape of a future API request.
  await Promise.resolve();

  const match = stubBooks.find(
    (book) => book.title.toLowerCase() === title.trim().toLowerCase()
  );

  return {
    title: match?.title ?? title.trim(),
    author: typedAuthor.trim() || match?.author || 'Unknown author',
  };
}