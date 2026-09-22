import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { generateAccessToken, generateRefreshToken, setTokenCookies } from "../utils/generateTokens";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: "customer", // registration is always customer — admin is seeded, not signed up
    });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: (err as Error).message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out" });
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as {
      id: string;
      role: "customer" | "admin";
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({ message: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  res.status(200).json({
    user: {
      id: req.user!._id,
      name: req.user!.name,
      email: req.user!.email,
      phone: req.user!.phone,
      address: req.user!.address,
      avatar: req.user!.avatar,
      role: req.user!.role,
    },
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name, phone, address, avatar } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      req.user.name = name.trim();
    }

    if (phone !== undefined) req.user.phone = phone.trim();
    if (address !== undefined) req.user.address = address.trim();
    if (avatar !== undefined) req.user.avatar = avatar.trim();

    await req.user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        avatar: req.user.avatar,
        role: req.user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to update profile",
    });
  }
};