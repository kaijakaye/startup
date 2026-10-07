import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
  return (
    <body>
    <header>
      <h1>Shelf Life</h1>

      <nav className="navbar navbar-expand-lg">
        <menu>
          <li><a href="index.html">Login</a></li>
          <li><a href="dashboard.html">Dashboard</a></li>
          <li><a href="bookshelf.html">Bookshelf</a></li>
          <li><a href="bookbuzz.html">Book Buzz</a></li>
          <li><a href="bookclub.html">Book Club</a></li>
          <li><a href="bookprogress.html">Book Progress</a></li>
        </menu>
      </nav>

      <hr />
    </header>

    <main>App components go here</main>

    <footer>
      <hr />
      <span className="text-reset">Author Name: Kaija Sorensen</span>
      <br />
      <a href="https://github.com/kaijakaye/startup">GitHub</a>
    </footer>
  </body>
  )
}