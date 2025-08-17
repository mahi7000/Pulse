import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const prisma = new PrismaClient();

// Extend Request to include userId
export interface AuthRequest extends Request {
  userId?: number;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Malformed token" });
    }

    // Check if token is revoked
    const revoked = await prisma.revokedToken.findUnique({
      where: { token },
    });
    if (revoked) {
      return res
        .status(401)
        .json({ error: "Token revoked. Please login again." });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
