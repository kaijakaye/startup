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
  if (await findUser('email', req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);

    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  }
});

// GetAuth login an existing user
apiRouter.post('/auth/login', async (req, res) => {
  const user = await findUser('email', req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      setAuthCookie(res, user.token);
      res.send({ email: user.email });
      return;
    }
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

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: uuid.v4(),
    email: email,
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
