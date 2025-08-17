// src/api/habits.ts
import API from "../api";
import type { Habit, HabitLog, Streak } from "../types/types";

interface HabitLogResponse {
  log: HabitLog;
  streak: Streak;
}

interface CreateHabitInput {
  name: string;
  description: string;
  targetCount: number;
}

export const habitsApi = {
  async fetchAll(token: string): Promise<Habit[]> {
    const response = await API.get("/habits", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async toggleLog(
    habitId: number,
    completed: boolean,
    token: string,
    count?: number
  ): Promise<HabitLogResponse> {
    const response = await API.post(
      `/habits/${habitId}/logs`,
      { completed, count },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async increment(
    habitId: number,
    currentCount: number,
    token: string
  ): Promise<HabitLogResponse> {
    return this.toggleLog(habitId, true, token, currentCount + 1);
  },

  async decrement(
    habitId: number,
    currentCount: number,
    token: string
  ): Promise<HabitLogResponse> {
    const newCount = Math.max(0, currentCount - 1);
    return this.toggleLog(habitId, newCount > 0, token, newCount);
  },

  async delete(habitId: number, token: string): Promise<void> {
    await API.delete(`/habits/${habitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async update(
    habitId: number,
    data: Partial<Habit>,
    token: string
  ): Promise<Habit> {
    const response = await API.put(`/habits/${habitId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  create: async (data: CreateHabitInput, token: string): Promise<Habit> => {
    const response = await API.post("/habits", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};