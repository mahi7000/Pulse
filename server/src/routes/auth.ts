import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const OTP_EXPIRY_MINUTES = 10;

// Setup mail transporter (use your SMTP provider or Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail", // or use custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// -------------------------
// Step 1: Send OTP
// -------------------------
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in DB
    await prisma.otp.create({
      data: {
        email,
        code: otpCode,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"Pulse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otpCode}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// -------------------------
// Step 2: Verify OTP & Create Account
// -------------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return res.status(400).json({ error: "All fields required" });
    }

    const record = await prisma.otp.findFirst({
      where: { email, code: otp },
      orderBy: { createdAt: "desc" },
    });

    if (!record) return res.status(400).json({ error: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    // Delete OTP after use
    await prisma.otp.delete({ where: { id: record.id } });

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// -------------------------
// Login (same as before)
// -------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ error: "No token found" });

    await prisma.revokedToken.create({ data: { token } });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

// -------------------------
// Profile (Protected)
// -------------------------
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});


export default router;
