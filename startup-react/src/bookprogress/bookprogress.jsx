import React, { useEffect, useState } from 'react';
import { getBooks, updateBook } from '../bookshelf/bookshelfAPI';
import './bookprogress.css';

const bookColors = ['blue', 'green', 'pink', 'purple'];

function progressPercent(book) {
  if (!book.totalPages || book.totalPages <= 0) return null;

  return Math.min(
    100,
    Math.round(((book.pagesRead ?? 0) / book.totalPages) * 100)
  );
}

export function BookProgress({ userName }) {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!userName) {
      setBooks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    getBooks()
      .then((allBooks) => {
        if (!cancelled) {
          setBooks(allBooks.filter((book) => book.shelf === 'reading'));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load your books.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userName]);

  async function handleUpdateProgress(event, book) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const pagesRead = Number(formData.get('pagesRead'));

    if (!Number.isInteger(pagesRead) || pagesRead < 0) {
      setError('Pages read must be a whole number of zero or greater.');
      return;
    }

    if (book.totalPages > 0 && pagesRead > book.totalPages) {
      setError(`Pages read cannot exceed ${book.totalPages}.`);
      return;
    }

    setSavingId(book.id);

    try {
      const updatedBook = await updateBook(book.id, { pagesRead });

      setBooks((currentBooks) =>
        currentBooks.map((currentBook) =>
          currentBook.id === updatedBook.id ? updatedBook : currentBook
        )
      );
    } catch (err) {
      setError(err.message || 'Could not update reading progress.');
    } finally {
      setSavingId(null);
    }
  }

  if (!userName) {
    return (
      <main>
        <p>Please log in to view your reading progress.</p>
      </main>
    );
  }

  return (
    <main>
      <h2>Current Reads</h2>
      <p>Track your progress on books you’re currently reading.</p>

      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading your books…</p>}

      {!loading && books.length === 0 && (
        <p>You don’t have any books on your Currently Reading shelf yet.</p>
      )}

      <div className="columns">
        {books.map((book, index) => {
          const color = bookColors[index % bookColors.length];
          const pagesRead = book.pagesRead ?? 0;
          const percent = progressPercent(book);

          return (
            <div className="column" key={book.id}>
              <div className={`book-cover book-cover--${color}`}>
                <span className="book-label">CURRENTLY READING</span>
                <h3>{book.title}</h3>
                <p className="book-author">{book.author}</p>
              </div>

              {percent !== null ? (
                <>
                  <progress value={percent} max="100" />
                  <p>
                    {pagesRead} of {book.totalPages} pages · {percent}% complete
                  </p>
                </>
              ) : (
                <p>{pagesRead} pages read</p>
              )}

              <form onSubmit={(event) => handleUpdateProgress(event, book)}>
                <label htmlFor={`pages-read-${book.id}`}>Pages read:</label>
                <input
                  id={`pages-read-${book.id}`}
                  name="pagesRead"
                  type="number"
                  min="0"
                  max={book.totalPages > 0 ? book.totalPages : undefined}
                  step="1"
                  defaultValue={pagesRead}
                  required
                />

                <button
                  className="btn btn-success"
                  type="submit"
                  disabled={savingId === book.id}
                >
                  {savingId === book.id ? 'Saving…' : 'Update'}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}