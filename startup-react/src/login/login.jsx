import React from 'react';

export function Login() {
  return (
    <main>
      <h1>Welcome to Shelf Life</h1>
      <form method="get" action="bookshelf.html">
        <div>
          <span>@</span>
          <input type="email" placeholder="your@email.com" />
        </div>
        <div>
          <span>🔒</span>
          <input type="password" placeholder="password" />
        </div>
        <button className="btn btn-success" type="submit">Login</button>
        <button className="btn btn-success" type="submit">Create</button>
      </form>
    </main>
  );
}