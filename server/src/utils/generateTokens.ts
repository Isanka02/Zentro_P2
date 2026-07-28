import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserRole } from "../types";

interface TokenPayload {
  id: string;
  role: UserRole;
}

export const generateAccessToken = (userId: Types.ObjectId, role: UserRole): string => {
  const payload: TokenPayload = { id: userId.toString(), role };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: Types.ObjectId, role: UserRole): string => {
  const payload: TokenPayload = { id: userId.toString(), role };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" });
};

export const setTokenCookies = (
  res: import("express").Response,
  accessToken: string,
  refreshToken: string
) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};