// src/api/user.ts
import API from "../api";
import { useAuth } from "../context/AuthContext";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  const res = await API.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}
