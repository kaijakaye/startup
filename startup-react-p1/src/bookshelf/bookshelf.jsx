import React from 'react';
import './bookshelf.css';

export function Bookshelf() {
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
}