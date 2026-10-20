import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductAvailability,
} from "../controllers/productController";
import { protect, optionalProtect, adminOnly } from "../middleware/auth";
import { uploadProductImages } from "../middleware/upload";
import { validateProductImages } from "../middleware/validateProductImages";
import { catalogSearchLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", catalogSearchLimiter, optionalProtect, getProducts);
router.get("/:id", getProductById);
router.post(
  "/",
  protect,
  adminOnly,
  uploadProductImages,
  validateProductImages,
  createProduct
);

router.put(
  "/:id",
  protect,
  adminOnly,
  uploadProductImages,
  validateProductImages,
  updateProduct
);
router.patch("/:id/availability", protect, adminOnly, updateProductAvailability);


export default router;
