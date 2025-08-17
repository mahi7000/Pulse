import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import { Server, Socket } from "socket.io";
import { config } from "dotenv";

import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import groupRoutes from "./routes/groups.js";
import challengeRoutes from "./routes/challenges.js";
import { prisma } from "./prismaClient.js";

// Load environment variables
config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with proper typing
export const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/habits", habitRoutes);
app.use("/groups", groupRoutes);
app.use("/challenges", challengeRoutes);

// Socket.IO events
io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinGroup", (groupId: number) => {
    socket.join(`group-${groupId}`);
    console.log(`${socket.id} joined group-${groupId}`);
  });

  socket.on(
    "sendMessage",
    async (data: { groupId: number; userId: number; text: string }) => {
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
    }
  );

  socket.on("leaveGroup", (groupId: number) => {
    socket.leave(`group-${groupId}`);
    console.log(`${socket.id} left group-${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT: number = parseInt(process.env.PORT ?? "5000", 10);

server.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
