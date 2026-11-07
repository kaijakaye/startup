import React from 'react';
import { Unauthenticated } from './unauthenticated';
import { Authenticated } from './authenticated';
import { AuthState } from './authState';

export function Login({ userName, authState, onAuthChange }) {
  const [logoutError, setLogoutError] = React.useState('');

  async function logout() {
    setLogoutError('');

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      localStorage.removeItem('userName');
      onAuthChange(userName, AuthState.Unauthenticated);
    } catch (err) {
      setLogoutError(err.message || 'Could not log out.');
    }
  }

  return (
    <main className="container-fluid text-center">
      {authState !== AuthState.Unknown && <h1>Welcome to Shelf Life</h1>}

      {logoutError && (
        <p className="alert alert-danger" role="alert">
          {logoutError}
        </p>
      )}

      {authState === AuthState.Authenticated && (
        <Authenticated userName={userName} onLogout={logout} />
      )}

      {authState === AuthState.Unauthenticated && (
        <Unauthenticated
          userName={userName}
          onLogin={(email) => onAuthChange(email, AuthState.Authenticated)}
        />
      )}
    </main>
  );
}