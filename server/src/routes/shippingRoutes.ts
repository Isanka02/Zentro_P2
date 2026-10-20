import { Router } from "express";
import { getShippingOptions } from "../utils/shipping";

const router = Router();

router.get("/options", (_req, res) => res.json(getShippingOptions()));

export default router;
