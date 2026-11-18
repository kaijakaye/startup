const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const uuid = require('uuid');
const app = express();
require('dotenv').config();
const path = require('path');

const authCookieName = 'token';

const {
  getUser,
  getUserByUsername,
  getUserByToken,
  getUserById,
  addUser,
  updateUser,
  updateUserRemoveAuth,
  getBooksForUser,
  addBookForUser,
  updateBookForUser,
  deleteBookForUser,
  findBookForUser,
  addFriendRequest,
  getPendingFriendRequestsForUser,
  addClub,
  getClubById,
  getClubMembership,
  getClubMembershipsForUser,
  addClubMembership,
  updateClubMembership,
  findAcceptedFriendshipBetween,
  getFriendRequestById,
  getAcceptedFriendRequestsForUser,
  updateFriendRequestStatus,
} = require('./database');

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the front-end static content hosting
app.use(express.static(path.join(__dirname, 'public')));

// Router for service endpoints
var apiRouter = express.Router();

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

apiRouter.get('/books/search', asyncHandler(async (req, res) => {
  const title = String(req.query.title ?? '').trim();
  const author = String(req.query.author ?? '').trim();
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (!title) {
    return res.status(400).send({ msg: 'Book title is required' });
  }

  if (!apiKey) {
    const error = new Error('Google Books API key is not configured on the server');
    error.status = 500;
    throw error;
  }

  const query = [
    `intitle:${title}`,
    author && `inauthor:${author}`,
  ].filter(Boolean).join(' ');

  const googleUrl = new URL('https://www.googleapis.com/books/v1/volumes');
  googleUrl.searchParams.set('q', query);
  googleUrl.searchParams.set('maxResults', '1');
  googleUrl.searchParams.set('key', apiKey);

  const googleResponse = await fetch(googleUrl);

  if (!googleResponse.ok) {
    const error = new Error('Google Books search failed');
    error.status = 502;
    throw error;
  }

  const data = await googleResponse.json();
  const volume = data.items?.[0];
  const info = volume?.volumeInfo;

  const book = {
    googleBooksId: volume?.id ?? null,
    title: info?.title ?? title,
    author: author || info?.authors?.join(', ') || 'Unknown author',
    coverUrl: info?.imageLinks?.thumbnail?.replace(/^http:/, 'https:') ?? '',
    totalPages: info?.pageCount ?? null,
  };

  res.send({ book });
}));

// CreateAuth a new user
apiRouter.post('/auth/create', asyncHandler(async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const username = String(req.body.username ?? '').trim().toLowerCase();
  const password = req.body.password;

  if (!email || !username || !password) {
    return res.status(400).send({ msg: 'Email, username, and password are required' });
  }

  if (
    await findUser('email', email) ||
    await findUser('username', username)
  ) {
    return res.status(409).send({ msg: 'Email or username already exists' });
  }

  const user = await createUser(email, username, password);
  setAuthCookie(res, user.token);
  res.status(201).send({ email: user.email, username: user.username });
}));

// GetAuth login an existing user
apiRouter.post('/auth/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const user = await findUser('email', email);

  if (user && await bcrypt.compare(req.body.password, user.password)) {
    user.token = uuid.v4();
    await updateUser(user);
    setAuthCookie(res, user.token);
    return res.send({ email: user.email, username: user.username });
  }

  res.status(401).send({ msg: 'Unauthorized' });
}));

// DeleteAuth logout a user
apiRouter.delete('/auth/logout', asyncHandler(async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    await updateUserRemoveAuth(user);
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
}));

// Middleware to verify that the user is authorized to call an endpoint
const verifyAuth = asyncHandler(async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  req.user = user;
  next();
});

// Create a club. The creator is its first accepted member and owner.
apiRouter.post('/clubs',verifyAuth,asyncHandler(async (req, res) => {
    const name = String(req.body.name ?? '').trim();

    if (!name) {
      return res.status(400).send({ msg: 'Club name is required' });
    }

    const club = {
      id: uuid.v4(),
      name,
      createdBy: req.user.id,
      currentBook: null,
    };

    const ownerMembership = {
      id: uuid.v4(),
      clubId: club.id,
      userId: req.user.id,
      status: 'accepted',
      role: 'owner',
    };

    await addClub(club);
    await addClubMembership(ownerMembership);

    res.status(201).send({
      ...club,
      memberStatus: 'accepted',
      role: 'owner',
    });
  })
);

// List clubs the logged-in user owns, joined, or has been invited to.
apiRouter.get('/clubs',verifyAuth,asyncHandler(async (req, res) => {
    const memberships = await getClubMembershipsForUser(req.user.id);

    const myClubs = await Promise.all(
      memberships.map(async (membership) => {
        const club = await getClubById(membership.clubId);

        if (!club) return null;

        // Omit MongoDB's internal _id to keep your existing API response shape.
        const { _id, ...clubData } = club;

        return {
          ...clubData,
          memberStatus: membership.status,
          role: membership.role,
        };
      })
    );

    res.send(myClubs.filter(Boolean));
  })
);

// Invite an accepted friend to a club.
apiRouter.post('/clubs/:id/invites',verifyAuth,asyncHandler(async (req, res) => {
    const club = await getClubById(req.params.id);

    if (!club) {
      return res.status(404).send({ msg: 'Club not found' });
    }

    const inviterMembership = await getClubMembership(
      club.id,
      req.user.id
    );

    if (inviterMembership?.status !== 'accepted') {
      return res
        .status(403)
        .send({ msg: 'Join the club before inviting members' });
    }

    const username = String(req.body.username ?? '').trim().toLowerCase();
    const invitee = await findUser('username', username);

    if (!invitee) {
      return res.status(404).send({ msg: 'User not found' });
    }

    const friendship = await findAcceptedFriendshipBetween(
      req.user.id,
      invitee.id
    );

    if (!friendship) {
      return res.status(403).send({ msg: 'You can only invite friends' });
    }

    const existing = await getClubMembership(club.id, invitee.id);

    if (existing?.status === 'pending' || existing?.status === 'accepted') {
      return res
        .status(409)
        .send({ msg: 'User is already invited or in the club' });
    }

    if (existing) {
      await updateClubMembership(club.id, invitee.id, {
        status: 'pending',
        role: 'member',
      });
    } else {
      await addClubMembership({
        id: uuid.v4(),
        clubId: club.id,
        userId: invitee.id,
        status: 'pending',
        role: 'member',
      });
    }

    res.status(201).send({
      clubId: club.id,
      username: invitee.username,
      status: 'pending',
    });
  })
);

// Accept or decline the logged-in user's pending invitation.
apiRouter.patch('/clubs/:id/invites/respond',verifyAuth,asyncHandler(async (req, res) => {
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res
        .status(400)
        .send({ msg: 'Action must be accept or decline' });
    }

    const membership = await getClubMembership(
      req.params.id,
      req.user.id
    );

    if (!membership || membership.status !== 'pending') {
      return res
        .status(404)
        .send({ msg: 'Pending invitation not found' });
    }

    const status = action === 'accept' ? 'accepted' : 'declined';
    const result = await updateClubMembership(
      req.params.id,
      req.user.id,
      { status }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(409)
        .send({ msg: 'Invitation is no longer pending' });
    }

    res.send({ clubId: req.params.id, status });
  })
);


//get the books for a given user. The user must be logged in to get their books. The user is identified by the token in the cookie.
apiRouter.get('/books', verifyAuth, asyncHandler(async (req, res) => {
  const myBooks = await getBooksForUser(req.user.id);
  res.send(myBooks);
}));

//create a new book for a given user and their shelf
apiRouter.post('/books', verifyAuth, asyncHandler(async (req, res) => {
  const { title, author, coverUrl, googleBooksId, shelf, totalPages } = req.body;
  const validShelves = ['to-read', 'reading', 'read'];

  if (!title || !validShelves.includes(shelf)) {
    return res.status(400).send({ msg: 'Title and valid shelf are required' });
  }

  const book = {
    id: uuid.v4(),
    userId: req.user.id,
    googleBooksId,
    title,
    author : author ?? '',
    coverUrl: coverUrl ?? '',
    shelf,
    pagesRead: 0,
    totalPages: totalPages ?? 0,
    rating: null,
  };

  await addBookForUser(req.user.id, book);
  res.status(201).send(book);
}));

//patch a different shelf, pagesRead, or rating for a given book. The user must be logged in to update their books. The user is identified by the token in the cookie.
apiRouter.patch('/books/:id', verifyAuth, asyncHandler(async (req, res) => {
  const book = await findBookForUser(req.user.id, req.params.id);
  if (!book) {
    return res.status(404).send({ msg: 'Book not found' });
  }

  const { shelf, pagesRead, rating } = req.body;
  const validShelves = ['to-read', 'reading', 'read'];
  const updates = {};

  if (shelf !== undefined && !validShelves.includes(shelf)) {
    return res.status(400).send({ msg: 'Invalid shelf' });
  }

  if (pagesRead !== undefined) {
    if (!Number.isInteger(pagesRead) || pagesRead < 0 || pagesRead > book.totalPages) {
      return res.status(400).send({ msg: 'Invalid pagesRead' });
    }
    updates.pagesRead = pagesRead;
  }

  if (rating !== undefined) {
    // Adjust this range if your UI uses a different rating scale.
    if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
      return res.status(400).send({ msg: 'Invalid rating' });
    }
    updates.rating = rating;
  }

  if (shelf !== undefined) updates.shelf = shelf;

  const updatedBook = await updateBookForUser(req.user.id, req.params.id, updates);

  if (!updatedBook) {
    return res.status(404).send({ msg: 'Book not found' });
  }

  res.send(updatedBook);
}));

//delete a book for a given user. The user must be logged in to delete their books. The user is identified by the token in the cookie.
apiRouter.delete('/books/:id',verifyAuth,asyncHandler(async (req, res) => {
    const result = await deleteBookForUser(req.user.id, req.params.id);

    if (result.deletedCount === 0) {
      return res.status(404).send({ msg: 'Book not found' });
    }

    res.status(204).end();
  })
);

apiRouter.post('/friends/requests', verifyAuth, asyncHandler(async (req, res) => {
  const username = String(req.body.username ?? '').trim().toLowerCase();

  if (!username) {
    return res.status(400).send({ msg: 'Username is required' });
  }

  const recipient = await findUser('username', username);

  if (!recipient) {
    return res.status(404).send({ msg: 'User not found' });
  }

  if (recipient.id === req.user.id) {
    return res.status(400).send({ msg: 'You cannot friend yourself' });
  }

  const existing = await findActiveFriendRequestBetween(
    req.user.id,
    recipient.id
  );

  if (existing) {
    return res.status(409).send({
      msg: 'A request or friendship already exists',
    });
  }

  const request = {
    id: uuid.v4(),
    requesterId: req.user.id,
    recipientId: recipient.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await addFriendRequest(request);
  res.status(201).send({ id: request.id, status: request.status });
}));

apiRouter.get('/friends/requests',verifyAuth,asyncHandler(async (req, res) => {
    const requests = await getPendingFriendRequestsForUser(req.user.id);

    const pending = await Promise.all(
      requests.map(async (request) => {
        const incoming = request.recipientId === req.user.id;
        const otherUserId = incoming
          ? request.requesterId
          : request.recipientId;

        const otherUser = await getUserById(otherUserId);

        return {
          id: request.id,
          direction: incoming ? 'incoming' : 'outgoing',
          username: otherUser?.username,
          createdAt: request.createdAt,
        };
      })
    );

    res.send(pending);
  })
);

apiRouter.patch('/friends/requests/:id',verifyAuth,asyncHandler(async (req, res) => {
    const request = await getFriendRequestById(req.params.id);

    if (!request) {
      return res.status(404).send({ msg: 'Request not found' });
    }

    if (request.recipientId !== req.user.id) {
      return res.status(403).send({ msg: 'Only the recipient can respond' });
    }

    if (request.status !== 'pending') {
      return res.status(409).send({ msg: 'Request is no longer pending' });
    }

    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).send({ msg: 'Action must be accept or decline' });
    }

    const status = action === 'accept' ? 'accepted' : 'declined';
    const result = await updateFriendRequestStatus(
      request.id,
      req.user.id,
      status
    );

    if (result.modifiedCount === 0) {
      return res.status(409).send({ msg: 'Request is no longer pending' });
    }

    res.send({ id: request.id, status });
  })
);

apiRouter.get('/friends',verifyAuth,asyncHandler(async (req, res) => {
    const requests = await getAcceptedFriendRequestsForUser(req.user.id);

    const friends = await Promise.all(
      requests.map(async (request) => {
        const friendId =
          request.requesterId === req.user.id
            ? request.recipientId
            : request.requesterId;

        const friend = await getUserById(friendId);
        return friend ? { id: friend.id, username: friend.username } : null;
      })
    );

    res.send(friends.filter(Boolean));
  })
);

apiRouter.get('/friends/:username/books',verifyAuth,asyncHandler(async (req, res) => {
    const username = req.params.username.toLowerCase();
    const friend = await findUser('username', username);

    if (!friend) {
      return res.status(404).send({ msg: 'User not found' });
    }

    const friendship = await findAcceptedFriendshipBetween(
      req.user.id,
      friend.id
    );

    if (!friendship) {
      return res.status(403).send({ msg: 'You are not friends with this user' });
    }

    const friendBooks = await getBooksForUser(friend.id);
    res.send(friendBooks);
  })
);

app.use(`/api`, apiRouter);
// Return a JSON 404 for unknown API endpoints.
app.use('/api', (_req, res) => {
  res.status(404).send({ msg: 'API endpoint not found' });
});

// Let React Router handle browser routes such as /bookclub.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  res.sendFile(path.join(__dirname, 'public', 'index.html'), (error) => {
    if (error) next(error);
  });
});

// Default error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  const status = err.status || 500;
  const message =
    status === 500 ? 'Internal server error' : err.message;

  res.status(status).send({
    type: err.name || 'Error',
    message,
    msg: message,
  });
});

async function createUser(email, username, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: uuid.v4(),
    email,
    username,
    password: passwordHash,
    token: uuid.v4(),
  };

  await addUser(user);
  return user;
}

async function findUser(field, value) {
  if (!value) return null;

  if (field === 'email') return getUser(value);
  if (field === 'username') return getUserByUsername(value);
  if (field === 'token') return getUserByToken(value);
  if (field === 'id') return getUserById(value);

  return null;
}

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    //secure: true,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  });
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
