import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const orderTrackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many tracking attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many checkout attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const discountValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many discount code attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const supportMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many support messages, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const catalogSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many catalog searches, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
