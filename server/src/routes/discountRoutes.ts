import { Router } from "express";
import {
  validateDiscount,
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discountController";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

router.post("/validate", validateDiscount);
router.get("/", protect, adminOnly, getDiscounts);
router.post("/", protect, adminOnly, createDiscount);
router.put("/:id", protect, adminOnly, updateDiscount);
router.delete("/:id", protect, adminOnly, deleteDiscount);

export default router;