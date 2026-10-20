import multer from "multer";
import { NextFunction, Request, Response } from "express";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per image
  },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, GIF, and AVIF images are allowed."));
    }
  },
});

export const uploadProductImages = (req: Request, res: Response, next: NextFunction) => {
  upload.array("images", 5)(req, res, (error: unknown) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Each product image must be 5 MB or smaller" });
      }
      return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid image upload" });
    }
    return next();
  });
};
