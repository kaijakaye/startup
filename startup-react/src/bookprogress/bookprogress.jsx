import React from 'react';
import './bookprogress.css';

export function BookProgress() {
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
}