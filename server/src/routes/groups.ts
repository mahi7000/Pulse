import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Create a group
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: req.userId!,
        admins: {
          create: [{ userId: req.userId! }], // owner is also admin
        },
        members: {
          create: [{ userId: req.userId! }], // add owner to members
        },
      },
      include: {
        admins: { include: { user: true } },
        members: { include: { user: true } },
      },
    });

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Edit a group
router.patch("/:groupId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const { name, description } = req.body;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Only owner or admins can edit
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } });
    if (group.ownerId !== req.userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to edit this group" });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { name, description },
      include: {
        admins: { include: { user: true } },
        members: { include: { user: true } },
      },
    });

    res.json(updatedGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to edit group" });
  }
});

// Delete a group
router.delete("/:groupId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (group.ownerId !== req.userId) {
      return res.status(403).json({ error: "Only the owner can delete this group" });
    }

    // Delete related records first
    await prisma.groupMessage.deleteMany({ where: { groupId } });
    await prisma.groupAdmin.deleteMany({ where: { groupId } });
    await prisma.groupMember.deleteMany({ where: { groupId } });
    await prisma.groupChallenge.deleteMany({ where: { groupId } });

    // Then delete the group
    await prisma.group.delete({ where: { id: groupId } });

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete group" });
  }
});



// Add member
router.post("/:groupId/members", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const { userId } = req.body;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } });
    const isOwner = group.ownerId === req.userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized" });

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (existingMember) {
      return res.status(400).json({ error: "User is already a member of this group" });
    }

    const member = await prisma.groupMember.create({ data: { groupId, userId } });
    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Promote member to admin
router.post("/:groupId/admins", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const { userId } = req.body;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isOwner = group.ownerId === req.userId;
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } });
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized" });

    const existing = await prisma.groupAdmin.findFirst({ where: { groupId, userId } });
    if (existing) return res.status(400).json({ error: "User is already an admin" });

    const newAdmin = await prisma.groupAdmin.create({ data: { groupId, userId } });
    res.json(newAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to promote admin" });
  }
});

// Demote admin
router.delete("/:groupId/admins/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (group.ownerId === userId) return res.status(400).json({ error: "Cannot demote owner" });

    const isOwner = group.ownerId === req.userId;
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } });
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized" });

    const deleted = await prisma.groupAdmin.deleteMany({ where: { groupId, userId } });
    res.json({ message: "Admin demoted", deletedCount: deleted.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to demote admin" });
  }
});

// Get group with members and admins
router.get("/:groupId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        admins: { include: { user: true } },
      },
    });
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get group" });
  }
});

// Fetch messages for a group
router.get("/:groupId/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);

    // Ensure user is a member or admin
    const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: req.userId } });
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } });
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || (!isMember && !isAdmin && group.ownerId !== req.userId)) {
      return res.status(403).json({ error: "Not authorized to view messages" });
    }

    const messages = await prisma.groupMessage.findMany({
      where: { groupId },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { sentAt: "asc" },
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
router.post("/:groupId/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const { text } = req.body;

    // Only members or admins can send messages
    const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: req.userId } });
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId, userId: req.userId } });
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || (!isMember && !isAdmin && group.ownerId !== req.userId)) {
      return res.status(403).json({ error: "Not authorized to send message" });
    }

    const message = await prisma.groupMessage.create({
      data: { groupId, senderId: req.userId!, text },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });

    // Emit via Socket.IO
    import("../index.js").then(({ io }) => io.to(`group-${groupId}`).emit("newMessage", message));

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Edit a message
router.patch("/:groupId/messages/:messageId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const messageId = Number(req.params.messageId);
    const { text } = req.body;

    const message = await prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Only the sender or group admins/owner can edit
    const group = await prisma.group.findUnique({ where: { id: message.groupId } });
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId: message.groupId, userId: req.userId } });
    if (req.userId !== message.senderId && group?.ownerId !== req.userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to edit this message" });
    }

    const updated = await prisma.groupMessage.update({ where: { id: messageId }, data: { text } });

    // Emit via Socket.IO
    import("../index.js").then(({ io }) => io.to(`group-${message.groupId}`).emit("updateMessage", updated));

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});

// Delete a message
router.delete("/:groupId/messages/:messageId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const messageId = Number(req.params.messageId);

    const message = await prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Only the sender or group admins/owner can delete
    const group = await prisma.group.findUnique({ where: { id: message.groupId } });
    const isAdmin = await prisma.groupAdmin.findFirst({ where: { groupId: message.groupId, userId: req.userId } });
    if (req.userId !== message.senderId && group?.ownerId !== req.userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    await prisma.groupMessage.delete({ where: { id: messageId } });

    // Emit via Socket.IO
    import("../index.js").then(({ io }) => io.to(`group-${message.groupId}`).emit("deleteMessage", { id: messageId }));

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});


export default router;