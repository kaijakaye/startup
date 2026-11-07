import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

export function Unauthenticated({ userName, onLogin }) {
  const [email, setEmail] = React.useState(userName ?? '');
  const [password, setPassword] = React.useState('');
  const [displayError, setDisplayError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const navigate = useNavigate();

  async function authenticate(path) {
    setDisplayError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setDisplayError('Enter your email and password.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.msg || `Request failed: ${response.status}`);
      }

      // This is just the displayed account name. The backend auth token
      // stays in its HttpOnly cookie.
      localStorage.setItem('userName', result.email);
      onLogin(result.email);
      navigate('/dashboard');
    } catch (err) {
      setDisplayError(err.message || 'Could not authenticate.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="input-group mb-3">
        <span className="input-group-text">Email</span>
        <input
          className="form-control"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="input-group mb-3">
        <span className="input-group-text">Password</span>
        <input
          className="form-control"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {displayError && (
        <p className="alert alert-danger" role="alert">
          {displayError}
        </p>
      )}

      <Button
        variant="primary"
        disabled={busy}
        onClick={() => authenticate('/api/auth/login')}
      >
        Login
      </Button>

      <Button
        className="ms-2"
        variant="secondary"
        disabled={busy}
        onClick={() => authenticate('/api/auth/create')}
      >
        Register
      </Button>
    </div>
  );
}