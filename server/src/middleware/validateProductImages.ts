import { NextFunction, Request, Response } from "express";

const signatures: Record<string, (buffer: Buffer) => boolean> = {
  "image/jpeg": (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  "image/png": (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
  "image/gif": (buffer) => buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)),
  "image/avif": (buffer) => {
    if (buffer.length < 16 || buffer.toString("ascii", 4, 8) !== "ftyp") return false;
    for (let offset = 8; offset + 4 <= buffer.length; offset += 4) {
      if (["avif", "avis"].includes(buffer.toString("ascii", offset, offset + 4))) return true;
    }
    return false;
  },
};

export const validateProductImages = (req: Request, res: Response, next: NextFunction) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const hasInvalidImage = files.some((file) => !signatures[file.mimetype]?.(file.buffer));

  if (hasInvalidImage) {
    return res.status(400).json({ message: "One or more uploads are not valid supported image files" });
  }

  return next();
};
