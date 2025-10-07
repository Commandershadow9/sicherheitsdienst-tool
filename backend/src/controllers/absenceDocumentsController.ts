import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import fs from 'fs/promises';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';
import { saveDocumentFile, resolveDocumentPath, removeDocumentFile } from '../utils/documentStorage';
import { ensureAccess, fetchAbsenceOr404 } from './absenceShared';

export const uploadAbsenceDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id } = req.params;
    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    const { filename, content, mimeType } = req.body as {
      filename?: string;
      content?: string;
      mimeType?: string;
    };

    if (!filename || !content) {
      throw createError(422, 'Dateiname und Inhalt sind erforderlich.');
    }

    const buffer = Buffer.from(content, 'base64');
    if (buffer.length > 50 * 1024 * 1024) {
      throw createError(413, 'Datei zu groß (max. 50MB).');
    }

    const saved = await saveDocumentFile({
      userId: absence.userId,
      originalName: filename,
      buffer,
      mimeType: mimeType || 'application/octet-stream',
      subFolder: 'absences',
    });

    const document = await prisma.absenceDocument.create({
      data: {
        absenceId: id,
        filename,
        mimeType: saved.mimeType || 'application/octet-stream',
        size: saved.size,
        storedAt: saved.storedAt,
        uploadedBy: actor.id,
      },
    });

    await submitAuditEvent(req, {
      action: 'ABSENCE.DOCUMENT.UPLOAD',
      resourceType: 'ABSENCE_DOCUMENT',
      resourceId: document.id,
      outcome: 'SUCCESS',
      data: { absenceId: id, filename, size: saved.size },
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const downloadAbsenceDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id, documentId } = req.params;

    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    const document = await prisma.absenceDocument.findFirst({
      where: { id: documentId, absenceId: id },
    });

    if (!document) {
      throw createError(404, 'Dokument nicht gefunden.');
    }

    const absolutePath = resolveDocumentPath(document.storedAt);
    const fileBuffer = await fs.readFile(absolutePath);

    await submitAuditEvent(req, {
      action: 'ABSENCE.DOCUMENT.DOWNLOAD',
      resourceType: 'ABSENCE_DOCUMENT',
      resourceId: documentId,
      outcome: 'SUCCESS',
      data: { absenceId: id, filename: document.filename },
    });

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.filename)}"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

export const deleteAbsenceDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id, documentId } = req.params;

    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    const document = await prisma.absenceDocument.findFirst({
      where: { id: documentId, absenceId: id },
    });

    if (!document) {
      throw createError(404, 'Dokument nicht gefunden.');
    }

    await removeDocumentFile(document.storedAt);
    await prisma.absenceDocument.delete({
      where: { id: documentId },
    });

    await submitAuditEvent(req, {
      action: 'ABSENCE.DOCUMENT.DELETE',
      resourceType: 'ABSENCE_DOCUMENT',
      resourceId: documentId,
      outcome: 'SUCCESS',
      data: { absenceId: id, filename: document.filename },
    });

    res.json({ success: true, message: 'Dokument gelöscht.' });
  } catch (error) {
    next(error);
  }
};
