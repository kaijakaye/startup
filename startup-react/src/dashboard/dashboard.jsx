import React from 'react';
import { Link } from 'react-router-dom';
import { progressPercent, shelfType, useBookshelf } from '../bookshelf/bookshelfData';
import './dashboard.css';

export function Dashboard({userName}) {
    const [books] = useBookshelf(userName);

    const reading = books.filter(book => shelfType(book.shelf) === 'reading');
    const tbr = books.filter(book => shelfType(book.shelf) === 'tbr');
    const finished = books.filter(book => shelfType(book.shelf) === 'finished');
    const currentBook = reading[0];

  return (
    <main>
      <h2>Welcome back, {userName}!</h2>

      <div className="dashboard-grid">
        <section className="continue-reading">
          <h2>Continue Reading</h2>

          {currentBook ? (
            <article className="current-book">
              <h3><em>{currentBook.title}</em></h3>
              <p>{currentBook.author}</p>
              <progress value={progressPercent(currentBook)} max="100" />
              <p>{progressPercent(currentBook)}% complete</p>
              <Link className="btn btn-success" to="/bookprogress">
                Continue Reading
              </Link>
            </article>
          ) : (
            <p>You don’t have a book marked as currently reading.</p>
          )}
        </section>

        <section className="other-reading">
          <h2>Also Reading</h2>

          {reading.slice(1).length ? reading.slice(1).map(book => (
            <article key={book.id}>
              <h3><em>{book.title}</em></h3>
              <p>{book.author}</p>
              <progress value={progressPercent(book)} max="100" />
              <p>{progressPercent(book)}% complete</p>
            </article>
          )) : <p>No other current reads.</p>}
        </section>

        <section className="reading-stats">
          <h2>My Reading Stats</h2>
          <div className="stat"><h3>{tbr.length}</h3><p>Books on TBR</p></div>
          <div className="stat"><h3>{reading.length}</h3><p>Currently Reading</p></div>
          <div className="stat"><h3>{finished.length}</h3><p>Books Finished</p></div>
        </section>

        <section className="tbr-preview">
          <h2>My TBR</h2>
          {tbr.length ? (
            <ul>
              {tbr.slice(0, 4).map(book => (
                <li key={book.id}><em>{book.title}</em></li>
              ))}
            </ul>
          ) : <p>Your TBR is empty.</p>}
          <Link className="btn btn-success" to="/bookshelf">
            View my full bookshelf
          </Link>
        </section>
      </div>
    </main>
  );
}