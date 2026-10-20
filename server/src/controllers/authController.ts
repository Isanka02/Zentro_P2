import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import User from "../models/User";
import { clearTokenCookies, generateAccessToken, generateRefreshToken, setTokenCookies } from "../utils/generateTokens";
import { getRequestBody } from "../utils/requestBody";

const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = getRequestBody(req.body);

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" ||
        !name.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (name.trim().length > 100 || email.trim().length > 254) {
      return res.status(400).json({ message: "Name or email is too long" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (password.length < 12 || password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be at least 12 characters and no more than 72 UTF-8 bytes" });
    }
    if ((phone !== undefined && (typeof phone !== "string" || phone.trim().length > 32)) ||
        (address !== undefined && (typeof address !== "string" || address.trim().length > 300))) {
      return res.status(400).json({ message: "Phone or address is invalid or too long" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      address,
      role: "customer", // registration is always customer — admin is seeded, not signed up
    });

    const accessToken = generateAccessToken(user._id, user.role, user.authVersion);
    const refreshToken = generateRefreshToken(user._id, user.role, user.authVersion);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    if (isDuplicateKey(err)) return res.status(409).json({ message: "Email already registered" });
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = getRequestBody(req.body);

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password ||
        email.trim().length > 254 || password.length > 128) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user._id, user.role, user.authVersion);
    const refreshToken = generateRefreshToken(user._id, user.role, user.authVersion);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

const getSessionClaims = (token: unknown, secret: string | undefined) => {
  if (typeof token !== "string" || !secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as { id?: unknown; authVersion?: unknown };
    const authVersion = decoded.authVersion ?? 0;
    if (typeof decoded.id !== "string" || !Types.ObjectId.isValid(decoded.id) ||
        !Number.isSafeInteger(authVersion) || (authVersion as number) < 0) return null;
    return { id: decoded.id, authVersion: authVersion as number };
  } catch {
    return null;
  }
};

/** Incrementing the account token version revokes its outstanding tokens on every device. */
export const logout = async (req: Request, res: Response) => {
  const sessions = [
    getSessionClaims(req.cookies?.accessToken, process.env.JWT_ACCESS_SECRET),
    getSessionClaims(req.cookies?.refreshToken, process.env.JWT_REFRESH_SECRET),
  ].filter((claims): claims is { id: string; authVersion: number } => claims !== null);
  const uniqueSessions = [...new Map(sessions.map((session) => [`${session.id}:${session.authVersion}`, session])).values()];

  try {
    for (const session of uniqueSessions) {
      await User.updateOne(
        { _id: session.id, authVersion: session.authVersion },
        { $inc: { authVersion: 1 } }
      );
    }
  } catch {
    clearTokenCookies(res);
    return res.status(503).json({ message: "Unable to revoke the server session. Please try again." });
  }

  clearTokenCookies(res);
  return res.status(200).json({ message: "Logged out" });
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      clearTokenCookies(res);
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as {
      id: string;
      role: "customer" | "admin";
      authVersion?: number;
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      clearTokenCookies(res);
      return res.status(401).json({ message: "User no longer exists" });
    }

    if ((decoded.authVersion ?? 0) !== user.authVersion) {
      clearTokenCookies(res);
      return res.status(401).json({ message: "Session expired; please log in again" });
    }

    const accessToken = generateAccessToken(user._id, user.role, user.authVersion);
    const refreshToken = generateRefreshToken(user._id, user.role, user.authVersion);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({ message: "Token refreshed" });
  } catch (err) {
    clearTokenCookies(res);
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

    const input = getRequestBody(req.body);
    const allowedFields = new Set(["name", "phone", "address", "avatar"]);
    if (Object.keys(input).length === 0 || Object.keys(input).some((key) => !allowedFields.has(key))) {
      return res.status(400).json({ message: "Profile update must include supported profile fields" });
    }
    const { name, phone, address, avatar } = input;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        return res.status(400).json({ message: "Name must be between 1 and 100 characters" });
      }
      req.user.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length > 32) return res.status(400).json({ message: "Phone must be 32 characters or fewer" });
      req.user.phone = phone.trim();
    }
    if (address !== undefined) {
      if (typeof address !== "string" || address.trim().length > 300) return res.status(400).json({ message: "Address must be 300 characters or fewer" });
      req.user.address = address.trim();
    }
    if (avatar !== undefined) {
      const validAvatar = typeof avatar === "string" && avatar.length <= 500_000 &&
        (avatar === "" || /^https:\/\//i.test(avatar) || /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(avatar));
      if (!validAvatar) return res.status(400).json({ message: "Avatar must be an HTTPS image URL or a JPEG image, up to 500 KB" });
      req.user.avatar = avatar.trim();
    }

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
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const { currentPassword, newPassword } = getRequestBody(req.body);
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (currentPassword.length > 128) return res.status(400).json({ message: "Current password is too long" });
    if (newPassword.length < 12 || newPassword.length > 72 || Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({ message: "New password must be at least 12 characters and no more than 72 UTF-8 bytes" });
    }
    if (currentPassword === newPassword) return res.status(400).json({ message: "Choose a different new password" });

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.authVersion += 1;
    await user.save();

    const accessToken = generateAccessToken(user._id, user.role, user.authVersion);
    const refreshToken = generateRefreshToken(user._id, user.role, user.authVersion);
    setTokenCookies(res, accessToken, refreshToken);
    return res.json({ message: "Password changed successfully. Other sessions have been signed out." });
  } catch {
    return res.status(500).json({ message: "Failed to change password" });
  }
};
