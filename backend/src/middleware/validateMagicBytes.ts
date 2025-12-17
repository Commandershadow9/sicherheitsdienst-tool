import type { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import { detectMagicBytes, type DetectedType } from '../utils/magicBytes';

type AllowedKind = 'pdf' | 'png' | 'jpg';

const TYPE_LABEL = 'PDF, JPG, PNG';

export function validateMagicBytes(allowed: AllowedKind[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
    }
    try {
      const detected: DetectedType | null = await detectMagicBytes(req.file.path);
      if (!detected || !allowed.includes(detected.ext)) {
        await fs.unlink(req.file.path).catch(() => {});
        return res
          .status(415)
          .json({ success: false, message: `Ungültiger Dateityp. Erlaubt: ${TYPE_LABEL}` });
      }

      // schreibe erkannte MIME in Multer-File-Objekt, damit Downstream sie nutzen kann
      req.file.mimetype = detected.mime;
      (req.file as any).detectedExt = detected.ext;
      return next();
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {});
      return next(error);
    }
  };
}
