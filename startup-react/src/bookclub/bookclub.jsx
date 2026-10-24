import React, { useEffect, useState } from 'react';
import { progressPercent, shelfType } from '../bookshelf/bookshelfData';
import {
  createClub,
  ensureLocalUser,
  getClubDetails,
  listBooksForUser,
  listClubs,
  listFriends,
  respondToClubInvite,
  setClubBook,
} from '../socialData';
import './bookclub.css';

function sameTitle(a = '', b = '') {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function BookClub({ userName }) {
  const [friends, setFriends] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [activeClubId, setActiveClubId] = useState('');
  const [details, setDetails] = useState(null);
  const [bookOptions, setBookOptions] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [clubName, setClubName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    if (!userName) return;

    await ensureLocalUser(userName);
    const [nextFriends, nextClubs] = await Promise.all([
      listFriends(userName),
      listClubs(userName),
    ]);

    setFriends(nextFriends);
    setClubs(nextClubs);
    setActiveClubId(current => {
      if (current && nextClubs.some(club =>
        club.id === current && club.memberStatus === 'accepted'
      )) return current;

      return nextClubs.find(club => club.memberStatus === 'accepted')?.id || '';
    });
  }

  useEffect(() => {
    refresh();
    window.addEventListener('shelflife:social-changed', refresh);
    window.addEventListener('shelflife:books-changed', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('shelflife:social-changed', refresh);
      window.removeEventListener('shelflife:books-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [userName]);

  const activeClub = clubs.find(club =>
    club.id === activeClubId && club.memberStatus === 'accepted'
  );
  const pendingInvites = clubs.filter(club => club.memberStatus === 'pending');

  useEffect(() => {
    let active = true;

    async function loadClub() {
      if (!activeClubId || !activeClub) {
        setDetails(null);
        setBookOptions([]);
        setProgressRows([]);
        return;
      }

      const club = await getClubDetails(activeClubId);
      if (!club || !active) return;

      const acceptedMembers = club.members.filter(member => member.status === 'accepted');
      const booksByMember = await Promise.all(acceptedMembers.map(async member => ({
        member,
        books: await listBooksForUser(member.username),
      })));

      const options = booksByMember.flatMap(({ member, books }) =>
        books.map(book => ({
          optionId: `${member.userId}:${book.id}`,
          bookId: book.id,
          sourceUserId: member.userId,
          sourceUsername: member.username,
          title: book.title,
          author: book.author,
        }))
      );

      const rows = club.members.map(member => {
        if (member.status !== 'accepted') {
          return { member, label: 'Invitation pending', percent: null };
        }

        const memberBooks = booksByMember.find(
          item => item.member.userId === member.userId
        )?.books ?? [];
        const book = club.currentBook
          ? memberBooks.find(item => sameTitle(item.title, club.currentBook.title))
          : null;

        if (!book) return { member, label: 'Not on their shelf', percent: null };

        const type = shelfType(book.shelf);
        const percent = type === 'finished' ? 100 : progressPercent(book);

        return {
          member,
          label: type === 'finished' ? 'Finished' : `${percent}% complete`,
          percent,
        };
      });

      if (active) {
        setDetails(club);
        setBookOptions(options);
        setProgressRows(rows);
      }
    }

    loadClub();
    return () => { active = false; };
  }, [activeClubId, activeClub, clubs]);

  async function handleCreateClub(event) {
    event.preventDefault();
    const club = await createClub(userName, clubName, selectedFriends);

    if (!club) {
      setMessage('Enter a club name and try again.');
      return;
    }

    setClubName('');
    setSelectedFriends([]);
    setActiveClubId(club.id);
    setMessage('Club created. Your friends can accept their invitations.');
    await refresh();
  }

  async function handleInviteResponse(clubId, accepted) {
    await respondToClubInvite(clubId, userName, accepted);
    if (accepted) setActiveClubId(clubId);
    await refresh();
  }

  async function handleSetBook(event) {
    event.preventDefault();
    const option = bookOptions.find(item => item.optionId === selectedBook);
    if (!option || !activeClubId) return;

    await setClubBook(activeClubId, {
      bookId: option.bookId,
      sourceUserId: option.sourceUserId,
      title: option.title,
      author: option.author,
    });
    setMessage(`${option.title} is now the club read.`);
    await refresh();
  }

  function toggleFriend(friendId) {
    setSelectedFriends(current =>
      current.includes(friendId)
        ? current.filter(id => id !== friendId)
        : [...current, friendId]
    );
  }

  return (
    <main>
      <h2>Book Club</h2>

      <section className="column">
        <h3>Create a club</h3>
        <form onSubmit={handleCreateClub}>
          <label htmlFor="club-name">Club name:</label>
          <input
            id="club-name"
            value={clubName}
            onChange={event => setClubName(event.target.value)}
            required
          />

          <fieldset>
            <legend>Invite friends</legend>
            {friends.length === 0 && <p>Add friends in Book Buzz first.</p>}
            {friends.map(friend => (
              <label key={friend.id} className="d-block">
                <input
                  type="checkbox"
                  checked={selectedFriends.includes(friend.id)}
                  onChange={() => toggleFriend(friend.id)}
                />
                {' '}{friend.displayName}
              </label>
            ))}
          </fieldset>

          <button className="btn btn-success" type="submit">Create club</button>
        </form>
        {message && <p role="status">{message}</p>}
      </section>

      {pendingInvites.length > 0 && (
        <section>
          <h3>Club invitations</h3>
          {pendingInvites.map(club => (
            <article className="column" key={club.id}>
              <p>You’re invited to <strong>{club.name}</strong>.</p>
              <button
                className="btn btn-success"
                onClick={() => handleInviteResponse(club.id, true)}
              >
                Accept
              </button>
              {' '}
              <button
                className="btn btn-secondary"
                onClick={() => handleInviteResponse(club.id, false)}
              >
                Decline
              </button>
            </article>
          ))}
        </section>
      )}

      {clubs.some(club => club.memberStatus === 'accepted') && (
        <section>
          <label htmlFor="club-picker">Your clubs:</label>
          <select
            id="club-picker"
            value={activeClubId}
            onChange={event => setActiveClubId(event.target.value)}
          >
            {clubs
              .filter(club => club.memberStatus === 'accepted')
              .map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
          </select>
        </section>
      )}

      {details && (
        <>
          <h3>
            {details.name}: {details.currentBook
              ? <i>{details.currentBook.title}</i>
              : 'Choose a club read'}
          </h3>

          <section className="column">
            <h4>Choose a book from a member’s shelf</h4>
            <form onSubmit={handleSetBook}>
              <label htmlFor="club-book">Available books:</label>
              <select
                id="club-book"
                value={selectedBook}
                onChange={event => setSelectedBook(event.target.value)}
                required
              >
                <option value="">Select a book</option>
                {bookOptions.map(book => (
                  <option key={book.optionId} value={book.optionId}>
                    {book.title} — {book.author} ({book.sourceUsername})
                  </option>
                ))}
              </select>
              <button className="btn btn-success" type="submit">Set club read</button>
            </form>
          </section>

          <h4>Members and progress</h4>
          <table>
            <thead>
              <tr><th>Reader</th><th>Status</th><th>Progress</th></tr>
            </thead>
            <tbody>
              {progressRows.map(({ member, label, percent }) => (
                <tr key={member.userId}>
                  <td>{member.displayName}</td>
                  <td>{member.status === 'accepted' ? 'Joined' : 'Invited'}</td>
                  <td>
                    {percent == null ? label : (
                      <>
                        <progress value={percent} max="100" />
                        {' '}{label}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

/*export function BookClub() {
  return (
    <main>
      <h2>Current Book: <i>East of Eden</i></h2>
      <table>
        <thead>
          <tr>
            <th>Reader</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kaija Sorensen</td>
            <td><label for="reading-progress">Reading Progress:</label> <progress id="reading-progress" value="65" max="100"></progress></td>
          </tr>
          <tr>
            <td>Abby Gugler</td>
            <td><label for="reading-progress-2">Reading Progress:</label> <progress id="reading-progress-2" value="30" max="100"></progress></td>
          </tr>
          <tr>
            <td>Cora Atkinson</td>
            <td><label for="reading-progress-3">Reading Progress:</label> <progress id="reading-progress-3" value="45" max="100"></progress></td>
          </tr>
        </tbody>
      </table>

      <h3>Add a Book Club Read</h3>
                <p>Enter the title of a book to read as a group</p>
                <form method="get" action="bookshelf.html">
                    <div>
                    <input type="text" placeholder="Search for a book title..." />
                    </div>
                    <div className="api-book-result">
                    </div>
                    <select id="options-clubs" name="options-clubs" placeholder="Select a book club group to read this with">
                        <option value="Girlfriends">Girlfriends</option>
                        <option value="Family">Family</option>
                        <option value="Work Besties">Work Besties</option>
                    </select><br></br>
                    <button className="btn btn-success" type="submit">Add to Book Club</button>
                </form>
    </main>
  );
}*/