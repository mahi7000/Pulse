// User
export interface User {
  id: number;
  email: string;
  password: string; // ❗ You probably won't send this to frontend, but kept for parity
  name: string;
  createdAt: string; // ISO string for Date
  updatedAt: string;

  habits?: Habit[];
  groups?: GroupMember[];
  messages?: GroupMessage[];
  ownedGroups?: Group[];
  challenges?: ChallengeParticipant[];
  groupAdmins?: GroupAdmin[];
}

// Habit
export interface Habit {
  id: number;
  name: string;
  description?: string;
  targetCount: number;
  color: string;
  createdAt: string;

  userId: number;
  user?: User;
  logs?: HabitLog[];
  streaks?: Streak[];
}

// HabitLog
export interface HabitLog {
  id: number;
  date: string;
  completed: boolean;
  count: number;

  habitId: number;
  habit?: Habit;
}

// Streak
export interface Streak {
  id: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;

  habitId: number;
  habit?: Habit;
}

// Group
export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt: string;

  ownerId: number;
  owner?: User;

  admins?: GroupAdmin[];
  members?: GroupMember[];
  messages?: GroupMessage[];
  challenges?: GroupChallenge[];
}

// GroupAdmin
export interface GroupAdmin {
  id: number;
  userId: number;
  groupId: number;

  user?: User;
  group?: Group;
}

// GroupMember
export interface GroupMember {
  id: number;
  joinedAt: string;

  userId: number;
  user?: User;
  groupId: number;
  group?: Group;
}

// GroupMessage
export interface GroupMessage {
  id: number;
  text: string;
  sentAt: Date;

  senderId: number;
  sender?: User;
  groupId: number;
  group?: Group;
}

// GroupChallenge
export interface GroupChallenge {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  target: number;

  groupId: number;
  group?: Group;
  participants?: ChallengeParticipant[];
}

// ChallengeParticipant
export interface ChallengeParticipant {
  id: number;
  completedCount: number;

  userId: number;
  user?: User;
  challengeId: number;
  challenge?: GroupChallenge;
}

// Otp
export interface Otp {
  id: number;
  email: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

// RevokedToken
export interface RevokedToken {
  id: number;
  token: string;
  revokedAt: string;
}
