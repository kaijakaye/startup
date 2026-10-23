import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { AuthState } from './login/authState';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Bookshelf } from './bookshelf/bookshelf';
import { BookBuzz } from './bookbuzz/bookbuzz';
import { BookClub } from './bookclub/bookclub';
import { BookProgress } from './bookprogress/bookprogress';

function App() {
  const [userName, setUserName] = React.useState(localStorage.getItem('userName') || '');
  const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
  const [authState, setAuthState] = React.useState(currentAuthState);

  function logout() {
    localStorage.removeItem('userName');
    props.onLogout();
  }

  return (
    <BrowserRouter>
      <header>
        <h1>Shelf Life</h1>
          <nav className='navbar navbar-expand-lg'>
            <menu>
              {authState === AuthState.Unauthenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/'>
                    Login
                  </NavLink>
                </li>
              )}
              {authState === AuthState.Authenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/login' onClick={() => logout()}>
                    Logout
                  </NavLink>
                </li>
              )}
              {authState === AuthState.Authenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/dashboard'>
                    Dashboard
                  </NavLink>
                </li>
              )}
              {authState === AuthState.Authenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/bookshelf'>
                    Bookshelf
                  </NavLink>
                </li>
              )}
              {authState === AuthState.Authenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/bookbuzz'>
                    Book Buzz
                  </NavLink>
                </li>
              )}
              {authState === AuthState.Authenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/bookclub'>
                    Book Club
                  </NavLink>
                </li>
              )}
              {authState === AuthState.Authenticated && (
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/bookprogress'>
                    Book Progress
                  </NavLink>
                </li>
              )}
            </menu>
          </nav>
        <hr />
        </header>

        <Routes>
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route
            path='/login'
            element={
              <Login
                userName={userName}
                authState={authState}
                onAuthChange={(userName, authState) => {
                  setUserName(userName);
                  setAuthState(authState);
                }}
              />
            }
            exact
          />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/bookshelf' element={<Bookshelf />} />
          <Route path='/bookbuzz' element={<BookBuzz />} />
          <Route path='/bookclub' element={<BookClub />} />
          <Route path='/bookprogress' element={<BookProgress />} />
          <Route path='*' element={<NotFound />} />
        </Routes>

        <footer>
          <hr />
          <span className='text-reset'>Author Name: Kaija Sorensen</span>
          <br />
          <a href='https://github.com/kaijakaye/startup' target='_blank' rel='noopener noreferrer'>
            GitHub
          </a>
        </footer>
    </BrowserRouter>
  );
}

function NotFound() {
  return <main className='container-fluid text-center'>404: Return to sender. Address unknown.</main>;
}

export default App;

/*export default function App() {
  return (
    <BrowserRouter>
        <header>
        <h1>Shelf Life</h1>

        <nav className="navbar navbar-expand-lg">
            <menu>
            <li><NavLink className='nav-link' to='/login'>Login</NavLink></li>
            <li><NavLink className='nav-link' to='/dashboard'>Dashboard</NavLink></li>
            <li><NavLink className='nav-link' to='/bookshelf'>Bookshelf</NavLink></li>
            <li><NavLink className='nav-link' to='/bookbuzz'>Book Buzz</NavLink></li>
            <li><NavLink className='nav-link' to='/bookclub'>Book Club</NavLink></li>
            <li><NavLink className='nav-link' to='/bookprogress'>Book Progress</NavLink></li>
            </menu>
        </nav>

        <hr />
        </header>

        <Routes>
            <Route path='/' element={<Login />} exact />
            <Route path='/login' element={<Login />} exact />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/bookshelf' element={<Bookshelf />} />
            <Route path='/bookbuzz' element={<BookBuzz />} />
            <Route path='/bookclub' element={<BookClub />} />
            <Route path='/bookprogress' element={<BookProgress />} />
            <Route path='*' element={<NotFound />} />
        </Routes>

        <footer>
        <hr />
        <span className="text-reset">Author Name: Kaija Sorensen</span>
        <br />
        <a href="https://github.com/kaijakaye/startup">GitHub</a>
        </footer>
  </BrowserRouter>
  )
}

function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}*/