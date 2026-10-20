import { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Blocks cross-origin browser mutations that could use the API's cookie session. */
export const enforceTrustedBrowserOrigin = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const requestOrigin = req.get("Origin");
  if (!requestOrigin) {
    if (req.headers.cookie) return res.status(403).json({ message: "Request origin is required" });
    return next();
  }

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(requestOrigin).origin;
  } catch {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }

  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(process.env.CLIENT_URL ?? "").origin;
  } catch {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }

  if (normalizedOrigin !== allowedOrigin) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }

  return next();
};
