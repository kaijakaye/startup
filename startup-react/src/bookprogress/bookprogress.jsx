import React from 'react';
import { progressPercent, shelfType, useBookshelf } from '../bookshelf/bookshelfData';
import './bookprogress.css';

export function BookProgress({ userName }) {
  const [books, updateBooks] = useBookshelf(userName);
  const bookColors = ['blue', 'green', 'pink', 'purple'];
  const reading = books.filter(book => shelfType(book.shelf) === 'reading');

  function updateProgress(event, book) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const unit = form.get('unit');
    const current = Number(form.get('current')) || 0;
    const total = unit === 'percent' ? 100 : Number(form.get('total')) || 0;

    const updatedBooks = books.map(item =>
      item.id === book.id
        ? { ...item, progress: { unit, current, total } }
        : item
    );

    updateBooks(updatedBooks);
  }

  return (
    <main>
      <h2>Current Reads</h2>
      <p>Track your progress on books you’re currently reading.</p>

      <div className="columns">
        {reading.map((book, index) => {
          const progress = book.progress;
          const color = bookColors[index % bookColors.length];
          const unit = progress?.unit || (book.pageCount ? 'pages' : 'percent');
          const current = progress?.current ?? 0;
          const total = progress?.total ?? book.pageCount ?? '';

          return (
            <div className="column" key={book.id}>
              <div className={`book-cover book-cover--${color}`}>
                <span className="book-label">CURRENTLY READING</span>
                <h3>{book.title}</h3>
                <p className="book-author">{book.author}</p>
              </div>

              <progress value={progressPercent(book)} max="100" />
              <p>{progressPercent(book)}% complete</p>

              <form onSubmit={event => updateProgress(event, book)}>
                <label htmlFor={`unit-${index}`}>Track by:</label>
                <select id={`unit-${index}`} name="unit" defaultValue={unit}>
                  <option value="pages">Pages</option>
                  <option value="chapters">Chapters</option>
                  <option value="percent">Percent</option>
                </select>
                <br/>

                <label htmlFor={`current-${index}`}>
                  {unit === 'percent' ? 'Percent complete' : `Current ${unit}`}
                </label>
                <input
                  id={`current-${index}`}
                  name="current"
                  type="number"
                  min="0"
                  max={unit === 'percent' ? '100' : undefined}
                  defaultValue={current}
                />

                {unit !== 'percent' && (
                  <>
                    <label htmlFor={`total-${index}`}>Total {unit}</label>
                    <input
                      id={`total-${index}`}
                      name="total"
                      type="number"
                      min="1"
                      defaultValue={total}
                    />
                  </>
                )}

                <button className="btn btn-success" type="submit">Update</button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}


/*export function BookProgress() {
  return (
    <main>
      <h2>Current Reads</h2>
        <p>Track your progress on books you're currently reading</p>
        <div className="columns">
            <div className="column">
              <div className="book-cover book-cover--blue">
                <span className="book-label">CURRENTLY READING</span>
                <h3>East of Eden</h3>
                <p className="book-author">John Steinbeck</p>
              </div>

              <p>Chapter 36 of 55</p>
              <progress value="67" max="100"></progress>
              <p>67% complete</p>

                <label htmlFor="reading-progress">Update Progress:</label>
                <input
                  type="number"
                  id="reading-progress1"
                  name="reading-progress"
                  min="0"
                  max="100"
                  value="67"
                />
                <button className="btn btn-success" type="submit">Update</button>
            </div>

            <div className="column">
              <div className="book-cover book-cover--green">
                <span className="book-label">CURRENTLY READING</span>
                <h3>Cinder</h3>
                <p className="book-author">Marissa Meyer</p>
              </div>

              <p>Chapter 12 of 35</p>
              <progress value="34" max="100"></progress>
              <p>34% complete</p>

                <label htmlFor="reading-progress">Update Progress:</label>
                <input
                  type="number"
                  id="reading-progress2"
                  name="reading-progress"
                  min="0"
                  max="100"
                  value="34"
                />
                <button className="btn btn-success" type="submit">Update</button>
            </div>

            <div className="column">
              <div className="book-cover book-cover--pink">
                <span className="book-label">CURRENTLY READING</span>
                <h3>The Great Gatsby</h3>
                <p className="book-author">F. Scott Fitzgerald</p>
              </div>

              <p>Chapter 5 of 9</p>
              <progress value="56" max="100"></progress>
              <p>56% complete</p>

                <label htmlFor="reading-progress">Update Progress:</label>
                <input
                  type="number"
                  id="reading-progress3"
                  name="reading-progress"
                  min="0"
                  max="100"
                  value="56"
                />
                <button className="btn btn-success" type="submit">Update</button>
            </div>
        </div>
    </main>
  );
}*/