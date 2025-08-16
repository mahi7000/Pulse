import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import groupRoutes from "./routes/groups.js";
import challengeRoutes from "./routes/challenges.js";
import { prisma } from "./prismaClient.js";

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/habits", habitRoutes);
app.use("/groups", groupRoutes);
app.use("/challenges", challengeRoutes)

// Socket.IO events
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join group room
  socket.on("joinGroup", (groupId: number) => {
    socket.join(`group-${groupId}`);
    console.log(`${socket.id} joined group-${groupId}`);
  });

  // Send message
  socket.on("sendMessage", async (data: { groupId: number; userId: number; text: string }) => {
    try {
      const message = await prisma.groupMessage.create({
        data: {
          groupId: data.groupId,
          senderId: data.userId,
          text: data.text,
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      });

      io.to(`group-${data.groupId}`).emit("newMessage", message);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  });

  // Leave group
  socket.on("leaveGroup", (groupId: number) => {
    socket.leave(`group-${groupId}`);
    console.log(`${socket.id} left group-${groupId}`);
  });

  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
