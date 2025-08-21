import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { io } from "../index.js";

const router = Router();

// -------------------------
// Interfaces
// -------------------------
interface CreateGroupBody {
  name: string;
  description?: string;
}

interface AddMemberBody {
  userId: number;
}

interface PromoteAdminBody {
  userId: number;
}

interface SendMessageBody {
  text: string;
}

interface EditMessageBody {
  text: string;
}

// -------------------------
// Predefined select objects for optimized queries
// -------------------------
const userSelect = {
  id: true,
  name: true,
  email: true,
};

const adminInclude = {
  user: { select: userSelect },
};

const memberInclude = {
  user: { select: userSelect },
};

const groupInclude = {
  admins: { include: adminInclude },
  members: { include: memberInclude },
  owner: { select: userSelect },
};

const messageInclude = {
  sender: { select: userSelect },
};

// -------------------------
// Helper Functions
// -------------------------
const checkGroupAccess = async (groupId: number, userId: number) => {
  const [group, isMember, isAdmin] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true }
    }),
    prisma.groupMember.findFirst({
      where: { groupId, userId },
      select: { id: true }
    }),
    prisma.groupAdmin.findFirst({
      where: { groupId, userId },
      select: { id: true }
    })
  ]);

  return {
    group,
    hasAccess: !!(group && (group.ownerId === userId || isMember || isAdmin))
  };
};

const checkGroupOwnership = async (groupId: number, userId: number) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true }
  });
  return group?.ownerId === userId;
};

const checkAdminAccess = async (groupId: number, userId: number) => {
  const [group, isAdmin] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true }
    }),
    prisma.groupAdmin.findFirst({
      where: { groupId, userId },
      select: { id: true }
    })
  ]);

  return {
    group,
    hasAccess: !!(group && (group.ownerId === userId || isAdmin))
  };
};

// -------------------------
// Create a group
// -------------------------
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest & Request<{}, {}, CreateGroupBody>, res: Response) => {
    try {
      const { name, description } = req.body;
      const userId = req.userId!;

      const group = await prisma.$transaction(async (tx) => {
        const group = await tx.group.create({
          data: { name, description, ownerId: userId },
        });

        await Promise.all([
          tx.groupAdmin.create({ data: { groupId: group.id, userId } }),
          tx.groupMember.create({ data: { groupId: group.id, userId } })
        ]);

        return tx.group.findUnique({
          where: { id: group.id },
          include: groupInclude,
        });
      });

      res.status(201).json(group);
    } catch (err) {
      console.error("Create group error:", err);
      res.status(500).json({ error: "Failed to create group" });
    }
  }
);

// -------------------------
// Get all groups for user
// -------------------------
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { admins: { some: { userId } } }
        ]
      },
      include: groupInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json(groups);
  } catch (err) {
    console.error("Get groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// -------------------------
// Get groups user does NOT belong to
// -------------------------
router.get("/explore", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    const groups = await prisma.group.findMany({
      where: {
        AND: [
          { ownerId: { not: userId } },
          { members: { none: { userId } } },
          { admins: { none: { userId } } },
        ],
      },
      include: {
        members: { include: memberInclude, take: 5 },
        admins: { include: adminInclude, take: 3 },
        owner: { select: userSelect },
      },
      take: 50,
      orderBy: { createdAt: "desc" }
    });

    res.json(groups);
  } catch (err) {
    console.error("Explore groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// -------------------------
// Get group details
// -------------------------
router.get(
  "/:groupId",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string }>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const userId = req.userId!;

      const accessCheck = await checkGroupAccess(groupId, userId);
      if (!accessCheck.hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: groupInclude,
      });

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      res.json(group);
    } catch (err) {
      console.error("Get group error:", err);
      res.status(500).json({ error: "Failed to get group" });
    }
  }
);

// -------------------------
// Edit a group
// -------------------------
router.patch(
  "/:groupId",
  requireAuth,
  async (
    req: AuthRequest & Request<{ groupId: string }, {}, Partial<CreateGroupBody>>,
    res: Response
  ) => {
    try {
      const groupId = Number(req.params.groupId);
      const { name, description } = req.body;
      const userId = req.userId!;

      const adminCheck = await checkAdminAccess(groupId, userId);
      if (!adminCheck.hasAccess) {
        return res.status(403).json({ error: "Not authorized to edit this group" });
      }

      const updatedGroup = await prisma.group.update({
        where: { id: groupId },
        data: { name, description },
        include: groupInclude,
      });

      res.json(updatedGroup);
    } catch (err) {
      console.error("Edit group error:", err);
      res.status(500).json({ error: "Failed to edit group" });
    }
  }
);

// -------------------------
// Delete a group
// -------------------------
router.delete("/:groupId", requireAuth, async (req: AuthRequest & Request<{ groupId: string }>, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.userId!;

    const isOwner = await checkGroupOwnership(groupId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: "Only the owner can delete" });
    }

    await prisma.$transaction([
      prisma.groupMessage.deleteMany({ where: { groupId } }),
      prisma.groupChallenge.deleteMany({ where: { groupId } }),
      prisma.groupAdmin.deleteMany({ where: { groupId } }),
      prisma.groupMember.deleteMany({ where: { groupId } }),
      prisma.group.delete({ where: { id: groupId } })
    ]);

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

// -------------------------
// Add member
// -------------------------
router.post(
  "/:groupId/members",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string }, {}, AddMemberBody>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const { userId: targetUserId } = req.body;
      const currentUserId = req.userId!;

      const adminCheck = await checkAdminAccess(groupId, currentUserId);
      if (!adminCheck.hasAccess) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const [existingMember, targetUser] = await Promise.all([
        prisma.groupMember.findFirst({ 
          where: { groupId, userId: targetUserId },
          select: { id: true }
        }),
        prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true }
        })
      ]);

      if (existingMember) {
        return res.status(400).json({ error: "User is already a member" });
      }
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const member = await prisma.groupMember.create({ 
        data: { groupId, userId: targetUserId },
        include: { user: { select: userSelect } }
      });
      
      res.status(201).json(member);
    } catch (err) {
      console.error("Add member error:", err);
      res.status(500).json({ error: "Failed to add member" });
    }
  }
);

// -------------------------
// Promote member to admin
// -------------------------
router.post(
  "/:groupId/admins",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string }, {}, PromoteAdminBody>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const { userId: targetUserId } = req.body;
      const currentUserId = req.userId!;

      const adminCheck = await checkAdminAccess(groupId, currentUserId);
      if (!adminCheck.hasAccess) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const [existingAdmin, targetUser] = await Promise.all([
        prisma.groupAdmin.findFirst({ 
          where: { groupId, userId: targetUserId },
          select: { id: true }
        }),
        prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true }
        })
      ]);

      if (existingAdmin) {
        return res.status(400).json({ error: "User is already an admin" });
      }
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const newAdmin = await prisma.groupAdmin.create({ 
        data: { groupId, userId: targetUserId },
        include: { user: { select: userSelect } }
      });
      
      res.status(201).json(newAdmin);
    } catch (err) {
      console.error("Promote admin error:", err);
      res.status(500).json({ error: "Failed to promote admin" });
    }
  }
);

// -------------------------
// Demote admin
// -------------------------
router.delete(
  "/:groupId/admins/:userId",
  requireAuth,
  async (
    req: AuthRequest & Request<{ groupId: string; userId: string }>,
    res: Response
  ) => {
    try {
      const groupId = Number(req.params.groupId);
      const targetUserId = Number(req.params.userId);
      const currentUserId = req.userId!;

      const [group, isAdmin] = await Promise.all([
        prisma.group.findUnique({ 
          where: { id: groupId },
          select: { ownerId: true }
        }),
        prisma.groupAdmin.findFirst({ 
          where: { groupId, userId: currentUserId },
          select: { id: true }
        })
      ]);

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      if (group.ownerId === targetUserId) {
        return res.status(400).json({ error: "Cannot demote owner" });
      }
      if (group.ownerId !== currentUserId && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const deleted = await prisma.groupAdmin.deleteMany({ 
        where: { groupId, userId: targetUserId }
      });
      
      res.json({ message: "Admin demoted", deletedCount: deleted.count });
    } catch (err) {
      console.error("Demote admin error:", err);
      res.status(500).json({ error: "Failed to demote admin" });
    }
  }
);

// -------------------------
// Send a message to a group
// -------------------------
router.post(
  "/:groupId/messages",
  requireAuth,
  async (
    req: AuthRequest & Request<{ groupId: string }, {}, SendMessageBody>,
    res: Response
  ) => {
    try {
      const groupId = Number(req.params.groupId);
      const { text } = req.body;
      const userId = req.userId!;

      if (!text?.trim()) {
        return res.status(400).json({ error: "Message text cannot be empty" });
      }

      const accessCheck = await checkGroupAccess(groupId, userId);
      if (!accessCheck.hasAccess) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }

      const message = await prisma.groupMessage.create({
        data: {
          text: text.trim(),
          groupId,
          senderId: userId,
          sentAt: new Date()
        },
        include: messageInclude
      });

      io.to(`group-${groupId}`).emit("newMessage", message);
      res.status(201).json(message);
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

// -------------------------
// Get messages for a group (FIXED - returns array for frontend compatibility)
// -------------------------
router.get(
  "/:groupId/messages",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string }>, res: Response) => {
    try {
      const groupId = Number(req.params.groupId);
      const userId = req.userId!;

      const accessCheck = await checkGroupAccess(groupId, userId);
      if (!accessCheck.hasAccess) {
        return res.status(403).json({ error: "Not authorized to view messages" });
      }

      // Return array directly for frontend compatibility
      const messages = await prisma.groupMessage.findMany({
        where: { groupId },
        include: messageInclude,
        orderBy: { sentAt: "asc" }, // Chronological order
        take: 100 // Reasonable limit
      });

      res.json(messages);
    } catch (err) {
      console.error("Get messages error:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

// -------------------------
// Edit a message
// -------------------------
router.patch(
  "/:groupId/messages/:messageId",
  requireAuth,
  async (
    req: AuthRequest & Request<{ groupId: string; messageId: string }, {}, EditMessageBody>,
    res: Response
  ) => {
    try {
      const messageId = Number(req.params.messageId);
      const { text } = req.body;
      const userId = req.userId!;

      if (!text?.trim()) {
        return res.status(400).json({ error: "Message text cannot be empty" });
      }

      const [message, adminCheck] = await Promise.all([
        prisma.groupMessage.findUnique({ 
          where: { id: messageId },
          include: { group: { select: { ownerId: true } } }
        }),
        prisma.groupAdmin.findFirst({ 
          where: { groupId: Number(req.params.groupId), userId },
          select: { id: true }
        })
      ]);

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      const canEdit = userId === message.senderId || 
                     message.group.ownerId === userId || 
                     adminCheck !== null;

      if (!canEdit) {
        return res.status(403).json({ error: "Not authorized to edit this message" });
      }

      const updated = await prisma.groupMessage.update({
        where: { id: messageId },
        data: { text: text.trim() },
        include: messageInclude
      });

      io.to(`group-${message.groupId}`).emit("updateMessage", updated);
      res.json(updated);
    } catch (err) {
      console.error("Edit message error:", err);
      res.status(500).json({ error: "Failed to edit message" });
    }
  }
);

// -------------------------
// Delete a message
// -------------------------
router.delete(
  "/:groupId/messages/:messageId",
  requireAuth,
  async (req: AuthRequest & Request<{ groupId: string; messageId: string }>, res: Response) => {
    try {
      const messageId = Number(req.params.messageId);
      const userId = req.userId!;

      const [message, adminCheck] = await Promise.all([
        prisma.groupMessage.findUnique({ 
          where: { id: messageId },
          include: { group: { select: { ownerId: true } } }
        }),
        prisma.groupAdmin.findFirst({ 
          where: { groupId: Number(req.params.groupId), userId },
          select: { id: true }
        })
      ]);

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      const canDelete = userId === message.senderId || 
                       message.group.ownerId === userId || 
                       adminCheck !== null;

      if (!canDelete) {
        return res.status(403).json({ error: "Not authorized to delete this message" });
      }

      await prisma.groupMessage.delete({ where: { id: messageId } });
      io.to(`group-${message.groupId}`).emit("deleteMessage", { id: messageId });

      res.json({ message: "Message deleted" });
    } catch (err) {
      console.error("Delete message error:", err);
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
);

// -------------------------
// Join a group
// -------------------------
router.post("/:groupId/join", requireAuth, async (req: AuthRequest & Request<{ groupId: string }>, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.userId!;

    const [group, existingMember] = await Promise.all([
      prisma.group.findUnique({ 
        where: { id: groupId },
        select: { id: true }
      }),
      prisma.groupMember.findFirst({ 
        where: { groupId, userId },
        select: { id: true }
      })
    ]);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (existingMember) {
      return res.status(400).json({ error: "You are already a member" });
    }

    const member = await prisma.groupMember.create({ 
      data: { groupId, userId },
      include: { user: { select: userSelect } }
    });
    
    res.status(201).json(member);
  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ error: "Failed to join group" });
  }
});

export default router;