const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url =
  `mongodb+srv://${encodeURIComponent(config.userName)}:` +
  `${encodeURIComponent(config.password)}@${config.hostname}`;

const client = new MongoClient(url);
const db = client.db('startup');
const userCollection = db.collection('user');
const bookCollection = db.collection('book');

// This will asynchronously test the connection and exit the process if it fails
(async function testConnection() {
  try {
    await client.connect();
    await db.command({ ping: 1 });
    console.log('Connected to MongoDB');
  } catch (ex) {
    console.error(`Unable to connect to MongoDB: ${ex.message}`);
    process.exit(1);
  }
})();

function getUser(email) {
  return userCollection.findOne({ email: email });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

function getUserByUsername(username) {
  return userCollection.findOne({ username });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

async function updateUser(user) {
  const {_id, ...userFields } = user;
  await userCollection.updateOne({ email: user.email }, { $set: userFields });
}

async function updateUserRemoveAuth(user) {
  await userCollection.updateOne({ email: user.email }, { $unset: { token: 1 } });
}

async function getBooksForUser(userId) {
  return bookCollection.find({ userId }).toArray();
}

async function addBookForUser(userId, book) {
  return bookCollection.insertOne({ ...book, userId });
}

async function updateBookForUser(userId, bookId, updates) {
  return bookCollection.updateOne({ id: bookId, userId }, { $set: updates });
}

async function deleteBookForUser(userId, bookId) {
  return bookCollection.deleteOne({ id: bookId, userId });
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  updateUserRemoveAuth,
  getBooksForUser,
  addBookForUser,
  getUserByUsername,
  updateBookForUser,
  deleteBookForUser,
};