/**
 * Site Image Controller
 * Handles image upload, retrieval, and deletion for sites
 * Extracted from siteController.ts (lines 265-329)
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ImageCategory } from '@prisma/client';

// GET /api/sites/:id/images - Get all images for a site
export const getSiteImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = req.query.category;

    const images = await prisma.siteImage.findMany({
      where: {
        siteId: id,
        ...(category && { category: category as ImageCategory }),
      },
      include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/images - Upload image
export const uploadSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { filename, filePath, category, description, fileSize, mimeType } = req.body;
    const uploadedBy = req.user?.id;

    if (!uploadedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const image = await prisma.siteImage.create({
      data: {
        siteId: id,
        filename,
        filePath,
        category: category || 'OTHER',
        description,
        fileSize,
        mimeType,
        uploadedBy,
      },
    });

    res.status(201).json({ success: true, message: 'Bild erfolgreich hochgeladen', data: image });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/images/:imageId - Delete image
export const deleteSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    await prisma.siteImage.delete({ where: { id: imageId } });
    res.status(204).send();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Bild nicht gefunden' });
      return;
    }
    next(error);
  }
};
