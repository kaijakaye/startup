import React from 'react';
import './dashboard.css';

export function Dashboard() {
  return (
    <main>
      <h2>Welcome back, Kaija!</h2>
      <div className="dashboard-grid">
      <section className="continue-reading">

            <h2>Continue Reading</h2>

            <article className="current-book">

                <div className="book-info">

                    <h3><em>East of Eden</em></h3>

                    <p>John Steinbeck</p>

                    <p>Chapter 36 of 55</p>

                    <progress value="67" max="100"></progress>

                    <p>67% complete</p>

                    <button className="btn btn-success"> Continue Reading</button>

                </div>

            </article>

        </section>

        <section className="other-reading">

            <h2>Also Reading</h2>

            <article>
                <h3><em>Cinder</em></h3>
                <p>34% complete</p>
                <progress value="34" max="100"></progress>
            </article>

            <article>
                <h3><em>The Screwtape Letters</em></h3>
                <p>12% complete</p>
                <progress value="12" max="100"></progress>
            </article>

        </section>

        <section className="reading-stats">

            <h2>My Reading Stats</h2>

            <div className="stat">
                <h3>23</h3>
                <p>Books on TBR</p>
            </div>

            <div className="stat">
                <h3>8</h3>
                <p>Books Read This Year</p>
            </div>

            <div className="stat">
                <h3>2,431</h3>
                <p>Pages Read</p>
            </div>

        </section>

        <section className="tbr-preview">

            <h2>My TBR</h2>

            <ul>
                <li><em>The Night Circus</em></li>
                <li><em>The Hunger Games</em></li>
                <li><em>Six of Crows</em></li>
                <li><em>Project Hail Mary</em></li>
            </ul>

            <button className="btn btn-success"> View my full bookshelf</button>

        </section>
        </div>
    </main>
  );
}