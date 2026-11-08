async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
  });

  const result =
    response.status === 204
      ? null
      : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.msg || `Request failed: ${response.status}`);
  }

  return result;
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// The backend creates users during registration.
// Remove any component calls to ensureLocalUser.
export function listFriends() {
  return apiRequest('/friends');
}

export async function listIncomingFriendRequests() {
  const requests = await apiRequest('/friends/requests');
  return requests.filter((request) => request.direction === 'incoming');
}

export async function listOutgoingFriendRequests() {
  const requests = await apiRequest('/friends/requests');
  return requests.filter((request) => request.direction === 'outgoing');
}

export function sendFriendRequest(_fromUsername, toUsername) {
  // Also accepts sendFriendRequest(username).
  const username = toUsername ?? _fromUsername;

  return apiRequest(
    '/friends/requests',
    jsonOptions('POST', { username })
  );
}

export function respondToFriendRequest(requestId, accepted) {
  return apiRequest(
    `/friends/requests/${encodeURIComponent(requestId)}`,
    jsonOptions('PATCH', {
      action: accepted ? 'accept' : 'decline',
    })
  );
}

export function inviteFriendToClub(clubId, username) {
  return apiRequest(
    `/clubs/${encodeURIComponent(clubId)}/invites`,
    jsonOptions('POST', { username })
  );
}

// These use the planned club routes. They will work after those backend
// routes are implemented.
export function listClubs() {
  return apiRequest('/clubs');
}

export async function createClub(_ownerUsername, name, invitedFriendIds = []) {
  const club = await apiRequest('/clubs', jsonOptions('POST', { name }));

  if (!invitedFriendIds.length) return club;

  const friends = await listFriends();
  const invitees = friends.filter((friend) =>
    invitedFriendIds.includes(friend.id)
  );

  for (const friend of invitees) {
    await apiRequest(
      `/clubs/${encodeURIComponent(club.id)}/invites`,
      jsonOptions('POST', { username: friend.username })
    );
  }

  return club;
}

export function respondToClubInvite(clubId, _username, accepted) {
  return apiRequest(
    `/clubs/${encodeURIComponent(clubId)}/invites/respond`,
    jsonOptions('PATCH', {
      action: accepted ? 'accept' : 'decline',
    })
  );
}

export function getClubDetails(clubId) {
  return apiRequest(`/clubs/${encodeURIComponent(clubId)}`);
}

export function setClubBook(clubId, book) {
  return apiRequest(
    `/clubs/${encodeURIComponent(clubId)}/reads`,
    jsonOptions('POST', { book })
  );
}

// This requires a backend route that checks the logged-in user is allowed
// to view this friend's books. It isn't implemented yet.
export function listBooksForUser(username) {
  return apiRequest(
    `/friends/${encodeURIComponent(username)}/books`
  );
}