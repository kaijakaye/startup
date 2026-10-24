import { readBooks } from './bookshelf/bookshelfData';

const USERS_KEY = 'shelflife:users:v1';
const SOCIAL_KEY = 'shelflife:social:v1';

function normalizeUsername(username = '') {
  return username.trim().toLowerCase();
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function readUsers() {
  return readJson(USERS_KEY, []);
}

function readSocial() {
  return {
    friendships: [],
    clubs: [],
    clubMembers: [],
    ...readJson(SOCIAL_KEY, {}),
  };
}

function notifyChange() {
  window.dispatchEvent(new Event('shelflife:social-changed'));
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyChange();
}

function saveSocial(data) {
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(data));
  notifyChange();
}

export async function ensureLocalUser(username) {
  const cleanUsername = username.trim();
  if (!cleanUsername) return null;

  const id = normalizeUsername(cleanUsername);
  const users = readUsers();
  let user = users.find(item => item.id === id);

  if (!user) {
    user = {
      id,
      username: cleanUsername,
      displayName: cleanUsername,
    };
    saveUsers([...users, user]);
  }

  return user;
}

export async function listBooksForUser(username) {
  return readBooks(username);
}

export async function listFriends(username) {
  const me = normalizeUsername(username);
  const users = readUsers();
  const { friendships } = readSocial();

  return friendships
    .filter(item =>
      item.status === 'accepted' &&
      (item.requesterId === me || item.addresseeId === me)
    )
    .map(item => {
      const friendId = item.requesterId === me ? item.addresseeId : item.requesterId;
      return users.find(user => user.id === friendId);
    })
    .filter(Boolean);
}

export async function listIncomingFriendRequests(username) {
  const me = normalizeUsername(username);
  const users = readUsers();
  const { friendships } = readSocial();

  return friendships
    .filter(item => item.addresseeId === me && item.status === 'pending')
    .map(item => ({
      ...item,
      sender: users.find(user => user.id === item.requesterId),
    }))
    .filter(item => item.sender);
}

export async function sendFriendRequest(fromUsername, toUsername) {
  const from = await ensureLocalUser(fromUsername);
  const targetId = normalizeUsername(toUsername);
  const target = readUsers().find(user => user.id === targetId);

  if (!from || !target) {
    return { ok: false, message: 'That username has not logged in on this browser yet.' };
  }
  if (from.id === target.id) {
    return { ok: false, message: 'You cannot add yourself as a friend.' };
  }

  const data = readSocial();
  const existing = data.friendships.find(item =>
    (item.requesterId === from.id && item.addresseeId === target.id) ||
    (item.requesterId === target.id && item.addresseeId === from.id)
  );

  if (existing?.status === 'accepted') {
    return { ok: false, message: 'You are already friends.' };
  }
  if (existing?.status === 'pending') {
    return { ok: false, message: 'A request is already pending.' };
  }

  if (existing) {
    existing.requesterId = from.id;
    existing.addresseeId = target.id;
    existing.status = 'pending';
  } else {
    data.friendships.push({
      id: makeId(),
      requesterId: from.id,
      addresseeId: target.id,
      status: 'pending',
    });
  }

  saveSocial(data);
  return { ok: true, message: `Friend request sent to ${target.displayName}.` };
}

export async function respondToFriendRequest(requestId, username, accepted) {
  const me = normalizeUsername(username);
  const data = readSocial();
  const request = data.friendships.find(item =>
    item.id === requestId &&
    item.addresseeId === me &&
    item.status === 'pending'
  );

  if (!request) return;

  request.status = accepted ? 'accepted' : 'declined';
  saveSocial(data);
}

export async function listClubs(username) {
  const me = normalizeUsername(username);
  const data = readSocial();

  return data.clubMembers
    .filter(member => member.userId === me)
    .map(member => {
      const club = data.clubs.find(item => item.id === member.clubId);
      return club ? { ...club, memberStatus: member.status, role: member.role } : null;
    })
    .filter(Boolean);
}

export async function createClub(ownerUsername, name, invitedFriendIds) {
  const owner = await ensureLocalUser(ownerUsername);
  if (!owner || !name.trim()) return null;

  const friends = await listFriends(ownerUsername);
  const validInviteIds = new Set(friends.map(friend => friend.id));
  const clubId = makeId();
  const data = readSocial();

  data.clubs.push({
    id: clubId,
    name: name.trim(),
    createdBy: owner.id,
    currentBook: null,
  });

  data.clubMembers.push({
    id: makeId(),
    clubId,
    userId: owner.id,
    status: 'accepted',
    role: 'owner',
  });

  for (const friendId of invitedFriendIds) {
    if (validInviteIds.has(friendId)) {
      data.clubMembers.push({
        id: makeId(),
        clubId,
        userId: friendId,
        status: 'pending',
        role: 'member',
      });
    }
  }

  saveSocial(data);
  return data.clubs.find(club => club.id === clubId);
}

export async function respondToClubInvite(clubId, username, accepted) {
  const me = normalizeUsername(username);
  const data = readSocial();
  const member = data.clubMembers.find(item =>
    item.clubId === clubId &&
    item.userId === me &&
    item.status === 'pending'
  );

  if (!member) return;

  member.status = accepted ? 'accepted' : 'declined';
  saveSocial(data);
}

export async function getClubDetails(clubId) {
  const data = readSocial();
  const users = readUsers();
  const club = data.clubs.find(item => item.id === clubId);

  if (!club) return null;

  const members = data.clubMembers
    .filter(item => item.clubId === clubId)
    .map(member => {
      const user = users.find(item => item.id === member.userId);
      return user ? { ...member, ...user } : null;
    })
    .filter(Boolean);

  return { ...club, members };
}

export async function setClubBook(clubId, book) {
  const data = readSocial();
  const club = data.clubs.find(item => item.id === clubId);
  if (!club) return;

  club.currentBook = book;
  saveSocial(data);
}