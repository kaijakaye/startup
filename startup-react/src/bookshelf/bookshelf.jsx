import { useEffect, useState } from 'react';
import './bookshelf.css';

import { searchBooks } from './bookAPI';
import { getBooks, createBook, updateBook } from './bookshelfAPI';

const shelves = [
  { id: 'tbr', title: 'To Be Read', description: 'Books you want to read later' },
  { id: 'reading', title: 'Currently Reading', description: "Books you're reading now" },
  { id: 'finished', title: 'Finished', description: "Books you've finished" },
];

const bookColors = ['blue', 'pink', 'green', 'yellow', 'lightgreen', 'purple'];

const toApiShelf = {
  tbr: 'to-read',
  reading: 'reading',
  finished: 'read',
};

const toUiShelf = {
  'to-read': 'tbr',
  reading: 'reading',
  read: 'finished',
};

function fromApiBook(book) {
  return { ...book, shelf: toUiShelf[book.shelf] ?? book.shelf };
}

function normalizeTitle(title = '') {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function BookCard({ book, index }) {
  const color = bookColors[index % bookColors.length];

  return (
    <div className={`shelf-book shelf-book--${color}`}>
      <strong>{book.title}</strong>
      <br />
      <span>{book.author}</span>
    </div>
  );
}

function ShelfColumn({ shelf, books }) {
  const shelfBooks = books.filter((book) => book.shelf === shelf.id);

  return (
    <section className="column">
      <h2>{shelf.title}</h2>
      <p>{shelf.description}</p>

      <div className="bookshelf">
        <div className="shelf-top" />
        <div className="shelf-left" />
        <div className="bookshelf-books">
          {shelfBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
        <div className="shelf-right" />
        <div className="shelf-bottom" />
      </div>

      {shelf.id === 'finished' &&
        shelfBooks.some((book) => book.rating != null) && (
          <div className="book-ratings">
            <h3>Your ratings</h3>
            {shelfBooks
              .filter((book) => book.rating != null)
              .map((book) => (
                <div className="book-rating" key={book.id}>
                  <span>{book.title}</span>
                  <span>★ {book.rating}/5</span>
                </div>
              ))}
          </div>
        )}

      {shelfBooks.length === 0 && <p>No books here yet.</p>}
    </section>
  );
}

export function Bookshelf({ userName }) {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [shelf, setShelf] = useState('tbr');
  const [rating, setRating] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!userName) {
      setBooks([]);
      return;
    }

    let cancelled = false;
    setError('');

    getBooks()
      .then((savedBooks) => {
        if (!cancelled) {
          setBooks(savedBooks.map(fromApiBook));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load your books.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userName]);

  async function handleSearch(event) {
    event.preventDefault();
    setError('');
    setSelectedBook(null);
    setSearchResults([]);
    setHasSearched(true);
    setSearching(true);

    try {
      const results = await searchBooks(title, author);
      setSearchResults(results);
    } catch (err) {
      setError(err.message || 'Book search failed.');
    } finally {
      setSearching(false);
    }
  }

  async function handleAddBook(event) {
    event.preventDefault();
    setError('');

    if (!selectedBook) {
      setError('Search for a book and select a result first.');
      return;
    }

    try {
      const existing = books.find(
        (book) =>
          (book.googleBooksId &&
            book.googleBooksId === selectedBook.googleBooksId) ||
          (normalizeTitle(book.title) === normalizeTitle(selectedBook.title) &&
            normalizeTitle(book.author) === normalizeTitle(selectedBook.author))
      );

      const changes = {
        shelf: toApiShelf[shelf],
        rating: shelf === 'finished' && rating !== '' ? Number(rating) : null,
      };

      if (existing) {
        const savedBook = await updateBook(existing.id, changes);
        const updatedBook = fromApiBook(savedBook);

        setBooks((current) =>
          current.map((book) =>
            book.id === updatedBook.id ? updatedBook : book
          )
        );
      } else {
        const savedBook = await createBook({
          ...selectedBook,
          ...changes,
          pagesRead: 0,
        });

        setBooks((current) => [...current, fromApiBook(savedBook)]);
      }

      setTitle('');
      setAuthor('');
      setRating('');
      setSelectedBook(null);
      setSearchResults([]);
      setHasSearched(false);
    } catch (err) {
      setError(err.message || 'Could not save the book. Please try again.');
    }
  }

  if (!userName) {
    return (
      <main>
        <p>Please log in to view your bookshelf.</p>
      </main>
    );
  }

  return (
    <main>
      <div className="columns">
        {shelves.map((item) => (
          <ShelfColumn key={item.id} shelf={item} books={books} />
        ))}
      </div>

      <section className="column">
        <h2>Add a book</h2>
        <p>Search for a book, select the right result, then choose a shelf.</p>

        {error && (
          <p className="alert alert-danger" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSearch}>
          <div>
            <label htmlFor="book-title">Book Title:</label>
            <input
              type="text"
              id="book-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setSelectedBook(null);
                setSearchResults([]);
                setHasSearched(false);
              }}
              placeholder="Book Title"
              required
            />
          </div>

          <div>
            <label htmlFor="author-name">Author Name (optional):</label>
            <input
              type="text"
              id="author-name"
              value={author}
              onChange={(event) => {
                setAuthor(event.target.value);
                setSelectedBook(null);
                setSearchResults([]);
                setHasSearched(false);
              }}
              placeholder="Author Name"
            />
          </div>

          <button
            className="btn btn-success"
            type="submit"
            disabled={searching}
          >
            {searching ? 'Searching…' : 'Search books'}
          </button>
        </form>

        {hasSearched && !searching && searchResults.length === 0 && !error && (
          <p>No books found. Try a different title or author.</p>
        )}

        {searchResults.map((book) => (
          <label key={book.googleBooksId} className="book-search-result">
            <input
              type="radio"
              name="selectedBook"
              checked={
                selectedBook?.googleBooksId === book.googleBooksId
              }
              onChange={() => setSelectedBook(book)}
            />

            {book.coverUrl && (
              <img src={book.coverUrl} alt="" width="60" />
            )}

            <span>
              <strong>{book.title}</strong>
              <br />
              {book.author}
            </span>
          </label>
        ))}

        {selectedBook && (
          <form onSubmit={handleAddBook}>
            <p>
              Selected: {selectedBook.title} — {selectedBook.author}
            </p>

            <div>
              <label htmlFor="book-shelf">Shelf:</label>
              <select
                id="book-shelf"
                value={shelf}
                onChange={(event) => setShelf(event.target.value)}
              >
                {shelves.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            {shelf === 'finished' && (
              <div>
                <label htmlFor="rating">Rating:</label>
                <input
                  type="number"
                  id="rating"
                  min="0"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  placeholder="Rating (0–5)"
                />
              </div>
            )}

            <button className="btn btn-success" type="submit">
              Add selected book to bookshelf
            </button>
          </form>
        )}
      </section>
    </main>
  );
}