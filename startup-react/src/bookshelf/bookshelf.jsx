import React from 'react';
import './bookshelf.css';
import { useEffect, useState } from 'react';
import { lookupBook } from './bookAPI';

const shelves = [
    { id: 'tbr', title: 'To Be Read', description: 'Books you want to read later' },
    { id: 'reading', title: 'Currently Reading', description: "Books you're reading now" },
    { id: 'finished', title: 'Finished', description: "Books you've finished" }
]

const bookColors = ['blue', 'pink', 'green', 'yellow', 'lightgreen', 'purple'];

function storageKey(userName) {
    return 'shelflife:books:${userName.toLowerCase()}';
}

function loadBooks(userName) {
    if (!userName) {
        return [];
    }

    try {
        return JSON.parse(localStorage.getItem(storageKey(userName))) ?? [];
    } catch {
        return [];
    }
}

function BookCard({ book, index }){
    const color = bookColors[index % bookColors.length];

    return (
        <div className={`shelf-book shelf-book--${color}`}>
            <strong>{book.title}</strong>
            <br />
            <span>{book.author}</span>
            {book.rating != null && <div> Rating: {book.rating}/5</div>}
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
                <div className="shelf-top"></div>
                <div className="shelf-left"></div>
                <div className="bookshelf-books">
                    {shelfBooks.map((book, index) => (
                        <BookCard key={index} book={book} index={index} />
                    ))}
                </div>
                <div className="shelf-right"></div>
                <div className="shelf-bottom"></div>
            </div>
        {shelfBooks.length === 0 && (<p>No books here yet.</p>)}
        </section>

        
    );
}

export function Bookshelf({ userName }) {
    const [books, setBooks] = useState(loadBooks(userName));
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [shelf, setShelf] = useState('tbr');
    const [rating, setRating] = useState('');

    useEffect(() => {
        if (userName) {
            localStorage.setItem(storageKey(userName), JSON.stringify(books));
        }
    }, [books, userName]);

    async function handleSubmit(event) {
        event.preventDefault();

        const bookDetails = await lookupBook(title, author);
        const newBook = {
            ...bookDetails,
            id: window.crypto.randomUUID?.() ?? '${Date.now()}-${Math.random()}',
            shelf,
            rating: shelf==='finished' && rating !== '' ? Number(rating) : null,
        };

        function normalizeTitle(title) {
            return title.toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        // After `bookDetails` is returned:
        const incomingBook = {
            ...bookDetails,
            shelf,
            rating: shelf === 'finished' && rating !== '' ? Number(rating) : null,
        };

        setBooks((currentBooks) => {
        const existing = currentBooks.find(
            (book) => normalizeTitle(book.title) === normalizeTitle(incomingBook.title)
        );

        if (existing) {
            // Keep the existing ID so React treats it as the same book.
            return currentBooks.map((book) =>
            book.id === existing.id
                ? {
                    ...book,
                    ...incomingBook,
                    author:
                    incomingBook.author === 'Unknown author'
                        ? book.author
                        : incomingBook.author,
                }
                : book
            );
        }

        return [
            ...currentBooks,
            {
            ...incomingBook,
            id: window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            },
        ];
        });
        setTitle('');
        setAuthor('');
        setRating('');
    }

    if(!userName) {
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
                <p>Enter the title and choose which shelf it belongs on.</p>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="book-title">Book Title:</label>
                        <input
                            type="text"
                            id="book-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Book Title"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="author-name">Author Name:</label>
                        <input
                            type="text"
                            id="author-name"
                            value={author}
                            onChange={(event) => setAuthor(event.target.value)}
                            placeholder="Author Name"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="book-shelf">Shelf:</label>
                        <select
                            id="book-shelf"
                            value={shelf}
                            onChange={(event) => setShelf(event.target.value)}
                        >
                            {shelves.map((item) => (
                                <option key={item.id} value={item.id}>{item.title}</option>
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
                                placeholder="Rating (0-5)"
                            />
                        </div>
                    )}
                    <button className="btn btn-success" type="submit">
                        Add to bookshelf
                    </button>
                </form>
            </section>

        </main>
    );
}

/*export function Bookshelf() {
  return (
    <main>
        <div className="columns">
            <div className="column">
                <h2>To Be Read</h2>
                <p>Books you want to read later</p>
                <div className="bookshelf">
                    <div className="shelf-top"></div>
                    <div className="shelf-left"></div>
                    <div className="shelf-right"></div>
                    <div className="shelf-bottom"></div>
                </div>
                <h3>Did you start it?</h3>
                <p>Choose a book to mark as currently reading</p>
                <form method="get" action="bookshelf.html">
                    <div>
                    <label for="book-title">Book Title:</label>
                    <input type="text" placeholder="Book Title" />
                    </div>
                    <div>
                    <label for="author-name">Author Name:</label>
                    <input type="text" placeholder="Author Name" />
                    </div>
                    <button className="btn btn-success" type="submit">Submit</button>
                </form>
            </div>

            <div className="column">
                <h2>Currently Reading</h2>
                <p>Books you're reading now</p>
                <div className="bookshelf">
                    <div className="shelf-top"></div>
                    <div className="shelf-left"></div>
                    <div className="shelf-right"></div>

                    <div className="shelf-book shelf-book--blue">
                        East of Eden
                    </div>

                    <div className="shelf-book shelf-book--pink">
                        Cinder
                    </div>

                    <div className="shelf-book shelf-book--green">
                        The Night Circus
                    </div>

                    <div className="shelf-bottom"></div>
                </div>
                <h3>Finished?</h3>
                <p>Choose a book to mark as finished</p>
                <form method="get" action="bookshelf.html">
                    <div>
                    <label for="book-title">Book Title:</label>
                    <input type="text" placeholder="Book Title" />
                    </div>
                    <div>
                    <label for="author-name">Author Name:</label>
                    <input type="text" placeholder="Author Name" />
                    </div>
                    <div>
                    <label for="rating">Rating:</label>
                    <input type="number" placeholder="Rating" min="0" max="5" step="0.5" />
                    </div>
                    <button className="btn btn-success" type="submit">Submit</button>
                </form>
            </div>

            <div className="column">
                <h2>Finished</h2>
                <p>Books you've finished</p>
                <div className="bookshelf">
                    <div className="shelf-top"></div>
                    <div className="shelf-left"></div>
                    <div className="shelf-right"></div>
                    <div className="shelf-bottom"></div>
                </div>
                <h3>Open it back up?</h3>
                <p>Choose a book to reread</p>
                <form method="get" action="bookshelf.html">
                    <div>
                    <label for="book-title">Book Title:</label>
                    <input type="text" placeholder="Book Title" />
                    </div>
                    <div>
                    <label for="author-name">Author Name:</label>
                    <input type="text" placeholder="Author Name" />
                    </div>
                    <button className="btn btn-success" type="submit">Submit</button>
                </form>
            </div>
        </div>

        <div className="column">
            <h2>Search for a book</h2>
            <p>Enter the title of a book you want to add to your current reads, TBR, or finished books</p>
            <form method="get" action="bookshelf.html">
                <div>
                <label for="book-title">Book Title:</label>
                <input type="text" placeholder="Search for a book title..." />
                </div>
                <div className="api-book-result">
                    <img src="https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1786033865i/9361589.jpg" width="100" alt="Book cover"/>
                    <div>
                        <h3>The Night Circus</h3>
                        <p>Erin Morgenstern</p>
                        <p>Placeholder data from book API</p>
                    </div>
                </div>
                <label for="options">Select a bookshelf:</label>
                <select id="options" name="options" placeholder="Select a bookshelf">
                    <option value="To Be Read">To Read</option>
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Finished">Finished</option>
                </select><br></br>
                <button className="btn btn-success" type="submit">Add to Bookshelf</button>
            </form>
        </div>
    </main>
  );
}*/