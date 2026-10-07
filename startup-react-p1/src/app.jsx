import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Bookshelf } from './bookshelf/bookshelf';
import { BookBuzz } from './bookbuzz/bookbuzz';
import { BookClub } from './bookclub/bookclub';
import { BookProgress } from './bookprogress/bookprogress';

export default function App() {
  return (
    <BrowserRouter>
        <body>
        <header>
        <h1>Shelf Life</h1>

        <nav className="navbar navbar-expand-lg">
            <menu>
            <li><NavLink className='nav-link' to='login'>Login</NavLink></li>
            <li><NavLink className='nav-link' to='dashboard'>Dashboard</NavLink></li>
            <li><NavLink className='nav-link' to='bookshelf'>Bookshelf</NavLink></li>
            <li><NavLink className='nav-link' to='bookbuzz'>Book Buzz</NavLink></li>
            <li><NavLink className='nav-link' to='bookclub'>Book Club</NavLink></li>
            <li><NavLink className='nav-link' to='bookprogress'>Book Progress</NavLink></li>
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
  </BrowserRouter>
  )
}