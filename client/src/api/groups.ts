import API from "../api";

// Fetch all groups for the logged-in user
export const fetchGroups = async (token: string) => {
  const res = await API.get("/groups", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Fetch groups the user does NOT belong to
export const fetchExploreGroups = async (token: string) => {
  const res = await API.get("/groups/explore", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Create a new group
export const createGroup = async (
  token: string,
  name: string,
  description?: string
) => {
  const res = await API.post(
    "/groups",
    { name, description },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Get a single group with members/admins
export const fetchGroup = async (token: string, groupId: number) => {
  const res = await API.get(`/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Add member (admin adds other users)
export const addMember = async (
  token: string,
  groupId: number,
  userId: number
) => {
  const res = await API.post(
    `/groups/${groupId}/members`,
    { userId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Self-join a group (from Explore)
export const joinGroup = async (token: string, groupId: number) => {
  const res = await API.post(
    `/groups/${groupId}/join`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Promote admin
export const promoteAdmin = async (
  token: string,
  groupId: number,
  userId: number
) => {
  const res = await API.post(
    `/groups/${groupId}/admins`,
    { userId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Delete group
export const deleteGroup = async (token: string, groupId: number) => {
  const res = await API.delete(`/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Fetch messages for a group
export const fetchMessages = async (token: string, groupId: number) => {
  const res = await API.get(`/groups/${groupId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendMessage = async (token: string, groupId: number, text: string) => {
  if (!text || !text.trim()) {
    throw new Error("Message text cannot be empty");
  }

  const res = await API.post(
    `/groups/${groupId}/messages`,
    { text }, // Must send { text }
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Optional: Leave group
export const leaveGroup = async (token: string, groupId: number) => {
  const res = await API.post(
    `/groups/${groupId}/leave`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Optional: Update group details
export const updateGroup = async (
  token: string,
  groupId: number,
  updates: { name?: string; description?: string }
) => {
  const res = await API.put(`/groups/${groupId}`, updates, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
