import { Router } from "express";
import { register, login, logout, refresh, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";


const router = Router();

router.post("/register", register);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", protect, getMe);

export default router;