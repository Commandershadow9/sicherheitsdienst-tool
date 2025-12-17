import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Storage-Konfiguration für Security Concept Attachments
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/security-concept-attachments');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Erstelle eindeutigen Dateinamen: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File-Filter: PDFs und Bilder erlauben (finale Prüfung via Magic-Bytes)
const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Ungültiger Dateityp. Erlaubt: PDF, JPG, PNG'));
  }
};

// Multer-Konfiguration für Attachments
export const uploadAttachment = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});
