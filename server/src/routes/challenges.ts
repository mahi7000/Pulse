import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { io } from "../index.js";

const router = Router();

// ----------------------------
// Request body types
// ----------------------------
interface CreateChallengeBody {
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  target: number;
}

interface UpdateChallengeBody {
  name?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  target?: number;
}

interface UpdateProgressBody {
  completedCount: number;
}

// ----------------------------
// Create challenge (Admins only)
// ----------------------------
router.post(
  "/:groupId",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string }, {}, CreateChallengeBody>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const { name, description, startDate, endDate, target } = req.body;

      const isOwnerOrAdmin =
        (await prisma.group.findFirst({ where: { id: groupId, ownerId: req.userId } })) ||
        (await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } }));

      if (!isOwnerOrAdmin) return res.status(403).json({ error: "Not authorized" });

      const challenge = await prisma.groupChallenge.create({
        data: {
          groupId,
          name,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          target,
          participants: { create: [{ userId: req.userId! }] },
        },
        include: { participants: true },
      });

      io.to(`group-${groupId}`).emit("newChallenge", challenge);
      res.json(challenge);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  }
);

// ----------------------------
// Join challenge (Participants)
// ----------------------------
router.post(
  "/:challengeId/join",
  requireAuth,
  async (req: AuthRequest & Request<{ challengeId: string }>, res: Response) => {
    try {
      const challengeId = Number(req.params.challengeId);

      const existing = await prisma.challengeParticipant.findFirst({
        where: { challengeId, userId: req.userId },
      });
      if (existing) return res.status(400).json({ error: "Already a participant" });

      const participant = await prisma.challengeParticipant.create({
        data: { userId: req.userId!, challengeId },
      });

      res.json(participant);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to join challenge" });
    }
  }
);

// ----------------------------
// Update progress
// ----------------------------
router.patch(
  "/:participantId/progress",
  requireAuth,
  async (
    req: AuthRequest & Request<{ participantId: string }, {}, UpdateProgressBody>,
    res: Response
  ) => {
    try {
      const participantId = Number(req.params.participantId);
      const { completedCount } = req.body;

      const participant = await prisma.challengeParticipant.update({
        where: { id: participantId },
        data: { completedCount },
        include: { challenge: true },
      });

      io.to(`group-${participant.challenge.groupId}`).emit("challengeProgress", participant);

      res.json(participant);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update progress" });
    }
  }
);

// ----------------------------
// Edit challenge (Admins only)
// ----------------------------
router.patch(
  "/:groupId/:challengeId",
  requireAuth,
  async (
    req: AuthRequest & Request<{ groupId: string; challengeId: string }, {}, UpdateChallengeBody>,
    res: Response
  ) => {
    try {
      const groupId = Number(req.params.groupId);
      const challengeId = Number(req.params.challengeId);
      const { name, description, startDate, endDate, target } = req.body;

      const isOwnerOrAdmin =
        (await prisma.group.findFirst({ where: { id: groupId, ownerId: req.userId } })) ||
        (await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } }));

      if (!isOwnerOrAdmin) return res.status(403).json({ error: "Not authorized" });

      const updated = await prisma.groupChallenge.update({
        where: { id: challengeId },
        data: {
          name,
          description,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          target,
        },
        include: { participants: true },
      });

      io.to(`group-${groupId}`).emit("challengeUpdated", updated);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to edit challenge" });
    }
  }
);

// ----------------------------
// Remove challenge (Admins only)
// ----------------------------
router.delete(
  "/:groupId/:challengeId",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string; challengeId: string }>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const challengeId = Number(req.params.challengeId);

      const isOwnerOrAdmin =
        (await prisma.group.findFirst({ where: { id: groupId, ownerId: req.userId } })) ||
        (await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } }));

      if (!isOwnerOrAdmin) return res.status(403).json({ error: "Not authorized" });

      await prisma.challengeParticipant.deleteMany({ where: { challengeId } });
      await prisma.groupChallenge.delete({ where: { id: challengeId } });

      io.to(`group-${groupId}`).emit("challengeDeleted", { id: challengeId });
      res.json({ message: "Challenge deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete challenge" });
    }
  }
);

// ----------------------------
// Get all challenges for a group
// ----------------------------
router.get(
  "/group/:groupId",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string }>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const challenges = await prisma.groupChallenge.findMany({
        where: { groupId },
        include: { participants: true },
      });
      res.json(challenges);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  }
);

export default router;
