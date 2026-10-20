import { Router } from "express";
import { getMyWishlist, importMyWishlist, toggleMyWishlistProduct } from "../controllers/wishlistController";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/", getMyWishlist);
router.post("/import", importMyWishlist);
router.post("/:productId/toggle", toggleMyWishlistProduct);

export default router;
