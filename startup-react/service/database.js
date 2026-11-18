const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url =
  `mongodb+srv://${encodeURIComponent(config.userName)}:` +
  `${encodeURIComponent(config.password)}@${config.hostname}`;

const client = new MongoClient(url);
const db = client.db('startup');
const userCollection = db.collection('user');
const bookCollection = db.collection('book');
const friendRequestCollection = db.collection('friendRequest');
const clubCollection = db.collection('club');
const clubMemberCollection = db.collection('clubMember');

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

function getUserById(id) {
  return userCollection.findOne({ id });
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
  const result = await bookCollection.updateOne(
    { id: bookId, userId },
    { $set: updates }
  );

  if (result.matchedCount === 0) return null;
  return findBookForUser(userId, bookId);
}

async function deleteBookForUser(userId, bookId) {
  return bookCollection.deleteOne({ id: bookId, userId });
}

async function findBookForUser(userId, bookId) {
  return bookCollection.findOne({ id: bookId, userId });
}

async function addFriendRequest(request) {
  return friendRequestCollection.insertOne(request);
}

async function findActiveFriendRequestBetween(userA, userB) {
  return friendRequestCollection.findOne({
    status: { $in: ['pending', 'accepted'] },
    $or: [
      { requesterId: userA, recipientId: userB },
      { requesterId: userB, recipientId: userA },
    ],
  });
}

async function findAcceptedFriendshipBetween(userA, userB) {
  return friendRequestCollection.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userA, recipientId: userB },
      { requesterId: userB, recipientId: userA },
    ],
  });
}

async function getFriendRequestById(id){
  return friendRequestCollection.findOne({ id });
}

async function getPendingFriendRequestsForUser(userId) {
  return friendRequestCollection.find({ status: 'pending',
    $or: [{ requesterId: userId }, { recipientId: userId }],
   }).toArray();
}

async function getAcceptedFriendRequestsForUser(userId) {
  return friendRequestCollection.find({ status: 'accepted',
    $or: [{ requesterId: userId }, { recipientId: userId }],
   }).toArray();
}

async function updateFriendRequestStatus(id, recipientId, status) {
  return friendRequestCollection.updateOne({ id, recipientId, status: 'pending' }, { $set: { status } });
}

async function addClub(club) {
  return clubCollection.insertOne(club);
}

async function getClubById(clubId) {
  return clubCollection.findOne({ id : clubId });
}

async function getClubMembership(clubId, userId) {
  return clubMemberCollection.findOne({ clubId, userId });
}

async function getClubMembershipsForUser(userId) {
  return clubMemberCollection.find({ userId }).toArray();
}

async function getClubMembershipsForClub(clubId) {
  return clubMemberCollection.find({ clubId }).toArray();
}

async function addClubMembership(membership) {
  return clubMemberCollection.insertOne(membership);
}

async function updateClubMembership(clubId, userId, updates) {
  return clubMemberCollection.updateOne(
    { clubId, userId },
    { $set: updates }
  );
}

async function updateClubCurrentBook(clubId, currentBook) {
  return clubCollection.updateOne(
    { id: clubId },
    { $set: { currentBook } }
  );
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
  getUserById,
  updateBookForUser,
  deleteBookForUser,
  findBookForUser,
  addFriendRequest,
  findActiveFriendRequestBetween,
  findAcceptedFriendshipBetween,
  getFriendRequestById,
  getPendingFriendRequestsForUser,
  getAcceptedFriendRequestsForUser,
  updateFriendRequestStatus,
  addClub,
  getClubById,
  getClubMembership,
  getClubMembershipsForUser,
  addClubMembership,
  updateClubMembership,
  getClubMembershipsForClub,
  updateClubCurrentBook,
};