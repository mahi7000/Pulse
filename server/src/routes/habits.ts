import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// -------------------------
// Create a Habit
// -------------------------
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description, targetCount, color } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        targetCount: targetCount || 1,
        color: color || "blue.400",
        userId: req.userId!,
      },
    });

    res.json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create habit" });
  }
});

// -------------------------
// Get all Habits for user
// -------------------------
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      include: { logs: true, streaks: true },
    });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habits" });
  }
});

// -------------------------
// Get single Habit
// -------------------------
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: Number(req.params.id), userId: req.userId },
      include: { logs: true, streaks: true },
    });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habit" });
  }
});

// -------------------------
// Update Habit
// -------------------------
router.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description, targetCount, color } = req.body;
    const habit = await prisma.habit.updateMany({
      where: { id: Number(req.params.id), userId: req.userId },
      data: { name, description, targetCount, color },
    });
    if (habit.count === 0) return res.status(404).json({ error: "Habit not found" });
    res.json({ message: "Habit updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update habit" });
  }
});

// -------------------------
// Delete Habit
// -------------------------
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const habit = await prisma.habit.deleteMany({
      where: { id: Number(req.params.id), userId: req.userId },
    });
    if (habit.count === 0) return res.status(404).json({ error: "Habit not found" });
    res.json({ message: "Habit deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

// -------------------------
// Add Habit Log for today
// -------------------------
router.post("/:id/logs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { completed = false, count = 1 } = req.body;
    const habitId = Number(req.params.id);

    // Optional: Ensure habit belongs to user
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.userId } });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize

    // Check if a log already exists for today
    let log = await prisma.habitLog.findFirst({
      where: { habitId, date: today },
    });

    if (log) {
      log = await prisma.habitLog.update({
        where: { id: log.id },
        data: { completed, count },
      });
    } else {
      log = await prisma.habitLog.create({
        data: { habitId, completed, count, date: today },
      });
    }

    // Update streak
    let streak = await prisma.streak.findFirst({ where: { habitId } });
    if (!streak) {
      streak = await prisma.streak.create({
        data: { habitId, currentStreak: completed ? 1 : 0, longestStreak: completed ? 1 : 0 },
      });
    } else {
      if (completed) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const yesterdayLog = await prisma.habitLog.findFirst({
          where: { habitId, date: yesterday, completed: true },
        });

        streak.currentStreak = yesterdayLog ? streak.currentStreak + 1 : 1;
        if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
        streak.lastUpdated = new Date();

        await prisma.streak.update({
          where: { id: streak.id },
          data: streak,
        });
      } else {
        streak.currentStreak = 0;
        streak.lastUpdated = new Date();
        await prisma.streak.update({ where: { id: streak.id }, data: streak });
      }
    }

    res.json({ log, streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add habit log" });
  }
});

export default router;
