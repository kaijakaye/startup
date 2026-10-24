import React, { useEffect, useState } from 'react';
import { progressPercent, shelfType } from '../bookshelf/bookshelfData';
import {
  ensureLocalUser,
  listBooksForUser,
  listFriends,
  listIncomingFriendRequests,
  respondToFriendRequest,
  sendFriendRequest,
} from '../socialData';
import './bookbuzz.css';

function StickFigure({ color }) {
  return (
    <div className={`stick-figure stick-figure--${color}`} aria-hidden="true">
      <div className="figure-head" />
      <div className="figure-neck" />
      <div className="figure-arm figure-arm--left" />
      <div className="figure-arm figure-arm--right" />
      <div className="figure-torso" />
      <div className="figure-leg figure-leg--left" />
      <div className="figure-leg figure-leg--right" />
    </div>
  );
}

export function BookBuzz({ userName }) {
  const [friendName, setFriendName] = useState('');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activity, setActivity] = useState([]);
  const [message, setMessage] = useState('');

  async function refresh() {
    if (!userName) return;

    await ensureLocalUser(userName);
    const [nextFriends, nextRequests] = await Promise.all([
      listFriends(userName),
      listIncomingFriendRequests(userName),
    ]);

    const feeds = await Promise.all(nextFriends.map(async friend => {
      const books = await listBooksForUser(friend.username);

      return books
        .filter(book => ['reading', 'finished'].includes(shelfType(book.shelf)))
        .map(book => ({
          friend,
          book,
          shelf: shelfType(book.shelf),
        }));
    }));

    setFriends(nextFriends);
    setRequests(nextRequests);
    setActivity(feeds.flat());
  }

  useEffect(() => {
    let active = true;

    async function load() {
      await refresh();
      if (!active) return;
    }

    load();
    window.addEventListener('shelflife:social-changed', load);
    window.addEventListener('shelflife:books-changed', load);
    window.addEventListener('storage', load);

    return () => {
      active = false;
      window.removeEventListener('shelflife:social-changed', load);
      window.removeEventListener('shelflife:books-changed', load);
      window.removeEventListener('storage', load);
    };
  }, [userName]);

  async function handleSendRequest(event) {
    event.preventDefault();
    const result = await sendFriendRequest(userName, friendName);
    setMessage(result.message);
    setFriendName('');
    await refresh();
  }

  async function handleRequestResponse(requestId, accepted) {
    await respondToFriendRequest(requestId, userName, accepted);
    await refresh();
  }

  return (
    <main>
      <h2>Book Buzz</h2>
      <p>See what your friends are reading and what they think about it.</p>

      <section className="column">
        <h3>Add a friend</h3>
        <form onSubmit={handleSendRequest}>
          <label htmlFor="friend-username">Friend’s username:</label>
          <input
            id="friend-username"
            value={friendName}
            onChange={event => setFriendName(event.target.value)}
            required
          />
          <button className="btn btn-success" type="submit">Send request</button>
        </form>
        {message && <p role="status">{message}</p>}
      </section>

      {requests.length > 0 && (
        <section>
          <h3>Friend requests</h3>
          {requests.map(request => (
            <article className="column" key={request.id}>
              <p>{request.sender.displayName} wants to be your friend.</p>
              <button
                className="btn btn-success"
                onClick={() => handleRequestResponse(request.id, true)}
              >
                Accept
              </button>
              {' '}
              <button
                className="btn btn-secondary"
                onClick={() => handleRequestResponse(request.id, false)}
              >
                Decline
              </button>
            </article>
          ))}
        </section>
      )}

      <section>
        <h3>Friends’ activity</h3>
        {friends.length === 0 && <p>You haven’t added any friends yet.</p>}
        {friends.length > 0 && activity.length === 0 && (
          <p>Your friends haven’t added current or finished books yet.</p>
        )}

        <div className="columns">
          {activity.map((item, index) => {
            const { friend, book, shelf } = item;
            const color = ['green', 'pink', 'blue', 'purple'][index % 4];

            return (
              <article className="column" key={`${friend.id}-${book.id}`}>
                <h3>{friend.displayName}</h3>
                <p>
                  {shelf === 'reading' ? 'Reading' : 'Finished'}: <i>{book.title}</i>
                </p>
                {shelf === 'reading' && (
                  <p>{progressPercent(book)}% complete</p>
                )}
                {book.rating != null && <p>Rating: {book.rating}/5</p>}
                <StickFigure color={color} />
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

/*export function BookBuzz() {
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
}*/