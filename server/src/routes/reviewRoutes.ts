import { Router } from "express";
import { createReview, getProductReviews, deleteReview } from "../controllers/reviewController";
import { optionalProtect, protect } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.post("/", protect, createReview);
router.get("/", optionalProtect, getProductReviews);
router.delete("/:id", protect, deleteReview);

export default router;
