const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const uuid = require('uuid');
const app = express();

const authCookieName = 'token';

// The scores and users are saved in memory and disappear whenever the service is restarted.
let users = [];
let books  = [];
let friendRequests = [];

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the front-end static content hosting
app.use(express.static('public'));

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

// CreateAuth a new user
apiRouter.post('/auth/create', async (req, res) => {
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
});

// GetAuth login an existing user
apiRouter.post('/auth/login', async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const user = await findUser('email', email);

  if (user && await bcrypt.compare(req.body.password, user.password)) {
    user.token = uuid.v4();
    setAuthCookie(res, user.token);
    return res.send({ email: user.email, username: user.username });
  }

  res.status(401).send({ msg: 'Unauthorized' });
});

// DeleteAuth logout a user
apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    delete user.token;
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// Middleware to verify that the user is authorized to call an endpoint
const verifyAuth = async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  req.user = user;
  next();
};


//get the books for a given user. The user must be logged in to get their books. The user is identified by the token in the cookie.
apiRouter.get('/books', verifyAuth, (req, res) => {
  const myBooks = books.filter((book) => book.userId === req.user.id);
  res.send(myBooks);
});

//create a new book for a given user and their shelf
apiRouter.post('/books', verifyAuth, (req, res) => {
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

  books.push(book);
  res.status(201).send(book);
});

//patch a different shelf, pagesRead, or rating for a given book. The user must be logged in to update their books. The user is identified by the token in the cookie.
apiRouter.patch('/books/:id', verifyAuth, (req, res) => {
  const book = books.find((b) => b.id === req.params.id && b.userId === req.user.id);
  if (!book) {
    return res.status(404).send({ msg: 'Book not found' });
  }

  const { shelf, pagesRead, rating } = req.body;
  const validShelves = ['to-read', 'reading', 'read'];

  if (shelf !== undefined && !validShelves.includes(shelf)) {
    return res.status(400).send({ msg: 'Invalid shelf' });
  }

  if (pagesRead !== undefined) {
    if (!Number.isInteger(pagesRead) || pagesRead < 0 || pagesRead > book.totalPages) {
      return res.status(400).send({ msg: 'Invalid pagesRead' });
    }
    book.pagesRead = pagesRead;
  }

  if (rating !== undefined) {
    // Adjust this range if your UI uses a different rating scale.
    if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
      return res.status(400).send({ msg: 'Invalid rating' });
    }
    book.rating = rating;
  }

  if (shelf !== undefined) book.shelf = shelf;

  res.send(book);
});

//delete a book for a given user. The user must be logged in to delete their books. The user is identified by the token in the cookie.
apiRouter.delete('/books/:id', verifyAuth, (req, res) => {
  const bookIndex = books.findIndex((b) => b.id === req.params.id && b.userId === req.user.id);
  if (bookIndex === -1) {
    return res.status(404).send({ msg: 'Book not found' });
  }

  books.splice(bookIndex, 1);
  res.status(204).end();
});

apiRouter.post('/friends/requests', verifyAuth, async (req, res) => {
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

  const samePair = (request) =>
    (request.requesterId === req.user.id && request.recipientId === recipient.id) ||
    (request.requesterId === recipient.id && request.recipientId === req.user.id);

  const existing = friendRequests.find(
    (request) =>
      samePair(request) &&
      ['pending', 'accepted'].includes(request.status)
  );

  if (existing) {
    return res.status(409).send({ msg: 'A request or friendship already exists' });
  }

  const request = {
    id: uuid.v4(),
    requesterId: req.user.id,
    recipientId: recipient.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  friendRequests.push(request);
  res.status(201).send({ id: request.id, status: request.status });
});

apiRouter.get('/friends/requests', verifyAuth, (req, res) => {
  const pending = friendRequests
    .filter(
      (request) =>
        request.status === 'pending' &&
        (request.requesterId === req.user.id ||
          request.recipientId === req.user.id)
    )
    .map((request) => {
      const incoming = request.recipientId === req.user.id;
      const otherUserId = incoming
        ? request.requesterId
        : request.recipientId;
      const otherUser = users.find((user) => user.id === otherUserId);

      return {
        id: request.id,
        direction: incoming ? 'incoming' : 'outgoing',
        username: otherUser?.username,
        createdAt: request.createdAt,
      };
    });

  res.send(pending);
});

apiRouter.patch('/friends/requests/:id', verifyAuth, (req, res) => {
  const request = friendRequests.find(
    (item) => item.id === req.params.id
  );

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

  request.status = action === 'accept' ? 'accepted' : 'declined';
  res.send({ id: request.id, status: request.status });
});

apiRouter.get('/friends', verifyAuth, (req, res) => {
  const friends = friendRequests
    .filter(
      (request) =>
        request.status === 'accepted' &&
        (request.requesterId === req.user.id ||
          request.recipientId === req.user.id)
    )
    .map((request) => {
      const friendId =
        request.requesterId === req.user.id
          ? request.recipientId
          : request.requesterId;

      const friend = users.find((user) => user.id === friendId);
      return friend && { id: friend.id, username: friend.username };
    })
    .filter(Boolean);

  res.send(friends);
});

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: 'public' });
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

  users.push(user);
  return user;
}

async function findUser(field, value) {
  if (!value) return null;

  return users.find((u) => u[field] === value);
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
