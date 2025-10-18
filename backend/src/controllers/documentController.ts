import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/sites/:siteId/documents - Alle Dokumente eines Objekts
export const getSiteDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const category = req.query.category as any;
    const latestOnly = req.query.latestOnly === 'true'; // Default: nur neueste Versionen

    const documents = await prisma.siteDocument.findMany({
      where: {
        siteId,
        ...(category && { category: category as any }),
        ...(latestOnly !== false && { isLatest: true }), // Nur neueste Versionen, außer explizit deaktiviert
      },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
        previousVersion: { select: { id: true, version: true } },
        nextVersions: { select: { id: true, version: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/documents/:id - Ein spezifisches Dokument
export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const document = await prisma.siteDocument.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
        previousVersion: { select: { id: true, version: true, title: true } },
        nextVersions: { select: { id: true, version: true, title: true, uploadedAt: true } },
        site: { select: { id: true, name: true } },
      },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Dokument nicht gefunden' });
      return;
    }

    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/documents/:id/versions - Alle Versionen eines Dokuments
export const getDocumentVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Finde das aktuelle Dokument
    const currentDoc = await prisma.siteDocument.findUnique({ where: { id } });
    if (!currentDoc) {
      res.status(404).json({ success: false, message: 'Dokument nicht gefunden' });
      return;
    }

    // Finde alle Versionen (vorherige und nachfolgende)
    const versions = await prisma.siteDocument.findMany({
      where: {
        OR: [
          { id: currentDoc.id },
          { previousVersionId: currentDoc.id },
          { nextVersions: { some: { id: currentDoc.id } } },
        ],
      },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { version: 'desc' },
    });

    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/documents - Dokument hochladen
export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const { title, description, category, isNewVersion, previousDocumentId } = req.body;
    const uploadedBy = req.user?.id;

    if (!uploadedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    // Prüfe ob Datei hochgeladen wurde
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
      return;
    }

    // Validierung
    if (!title || !category) {
      res.status(400).json({ success: false, message: 'Pflichtfelder fehlen: title, category' });
      return;
    }

    // Extrahiere Datei-Informationen aus Multer
    const filename = req.file.originalname;
    const filePath = req.file.path;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    let version = 1;
    let previousVersionId: string | null = null;

    // Wenn es eine neue Version ist
    if (isNewVersion && previousDocumentId) {
      const previousDoc = await prisma.siteDocument.findUnique({
        where: { id: previousDocumentId },
      });

      if (!previousDoc) {
        res.status(404).json({ success: false, message: 'Vorherige Dokumentversion nicht gefunden' });
        return;
      }

      version = previousDoc.version + 1;
      previousVersionId = previousDoc.id;

      // Alte Version als nicht mehr "latest" markieren
      await prisma.siteDocument.update({
        where: { id: previousDoc.id },
        data: { isLatest: false },
      });
    }

    const document = await prisma.siteDocument.create({
      data: {
        siteId,
        title,
        description,
        category,
        filename,
        filePath,
        fileSize,
        mimeType,
        version,
        isLatest: true,
        previousVersionId,
        uploadedBy,
      },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Dokument erfolgreich hochgeladen', data: document });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/documents/:id - Dokument-Metadaten aktualisieren (nicht File selbst)
export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;

    const document = await prisma.siteDocument.findUnique({ where: { id } });
    if (!document) {
      res.status(404).json({ success: false, message: 'Dokument nicht gefunden' });
      return;
    }

    const updated = await prisma.siteDocument.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
      },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, message: 'Dokument erfolgreich aktualisiert', data: updated });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/documents/:id/download - Dokument herunterladen
export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const document = await prisma.siteDocument.findUnique({ where: { id } });
    if (!document) {
      res.status(404).json({ success: false, message: 'Dokument nicht gefunden' });
      return;
    }

    // Sende Datei zum Download
    res.download(document.filePath, document.filename, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/documents/:id - Dokument löschen
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const document = await prisma.siteDocument.findUnique({ where: { id } });
    if (!document) {
      res.status(404).json({ success: false, message: 'Dokument nicht gefunden' });
      return;
    }

    // Wenn es die neueste Version ist und es eine vorherige gibt, markiere vorherige als "latest"
    if (document.isLatest && document.previousVersionId) {
      await prisma.siteDocument.update({
        where: { id: document.previousVersionId },
        data: { isLatest: true },
      });
    }

    await prisma.siteDocument.delete({ where: { id } });

    res.json({ success: true, message: 'Dokument erfolgreich gelöscht' });
  } catch (error) {
    next(error);
  }
};
