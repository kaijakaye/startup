import React from 'react';
import './bookbuzz.css';

export function BookBuzz() {
  return (
    <main>
      <h2>Friends</h2>
        <p>See what your friends are reading and what they think about it</p>
        <div className="columns">
            <div className="column">
                <h3>Kaija Sorensen</h3>
                <p>Finished: <i>East of Eden</i></p>
                <p>Rating: 4/5</p>
                <div className="stick-figure stick-figure--green" aria-hidden="true">
                  <div className="figure-head"></div>
                  <div className="figure-neck"></div>
                  <div className="figure-arm figure-arm--left"></div>
                  <div className="figure-arm figure-arm--right"></div>
                  <div className="figure-torso"></div>
                  <div className="figure-leg figure-leg--left"></div>
                  <div className="figure-leg figure-leg--right"></div>
                </div>
            </div>

            <div className="column">
                <h3>Abby Gugler</h3>
                <p>Finished: <i>The Great Gatsby</i></p>
                <p>Rating: 5/5</p>
                <div className="stick-figure stick-figure--pink" aria-hidden="true">
                  <div className="figure-head"></div>
                  <div className="figure-neck"></div>
                  <div className="figure-arm figure-arm--left"></div>
                  <div className="figure-arm figure-arm--right"></div>
                  <div className="figure-torso"></div>
                  <div className="figure-leg figure-leg--left"></div>
                  <div className="figure-leg figure-leg--right"></div>
                </div>
            </div>

            <div className="column">
                <h3>Cora Atkinson</h3>
                <p>Finished: <i>Pride and Prejudice</i></p>
                <p>Rating: 4.5/5</p>
                <div className="stick-figure stick-figure--blue" aria-hidden="true">
                  <div className="figure-head"></div>
                  <div className="figure-neck"></div>
                  <div className="figure-arm figure-arm--left"></div>
                  <div className="figure-arm figure-arm--right"></div>
                  <div className="figure-torso"></div>
                  <div className="figure-leg figure-leg--left"></div>
                  <div className="figure-leg figure-leg--right"></div>
                </div>
            </div>
        </div>
    </main>
  );
}