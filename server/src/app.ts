import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import discountRoutes from "./routes/discountRoutes";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import adminRoutes from "./routes/adminRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import supportRoutes from "./routes/supportRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import shippingRoutes from "./routes/shippingRoutes";
import { enforceTrustedBrowserOrigin } from "./middleware/enforceTrustedBrowserOrigin";

const app = express();

// Set an exact proxy hop count so rate limits can use client IPs behind a known proxy chain.
// Leave unset when the API receives connections directly from clients.
if (process.env.TRUST_PROXY_HOPS) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
}

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
  next();
});
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(enforceTrustedBrowserOrigin);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products/:productId/reviews", reviewRoutes);

app.get("/api/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "unavailable",
    database: databaseReady ? "connected" : "disconnected",
  });
});

app.use("/api", (_req, res) => {
  return res.status(404).json({ message: "API route not found" });
});

const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);

  const candidateStatus = typeof error === "object" && error !== null && "status" in error
    ? Number(error.status)
    : 500;
  const status = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus < 600
    ? candidateStatus
    : 500;

  if (status >= 500) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("Unhandled API error", errorName);
  }

  const message = status === 413
    ? "Request body is too large"
    : status < 500
      ? "Invalid API request"
      : "Unexpected server error";
  return res.status(status).json({ message });
};

app.use("/api", apiErrorHandler);

export default app;
