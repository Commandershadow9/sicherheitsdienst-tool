import express from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Alle Routes benötigen Authentifizierung
router.use(authenticate);

/**
 * GET /api/templates
 * Liste aller aktiven Vorlagen
 * Zugriff: ADMIN, MANAGER, DISPATCHER
 */
router.get('/', authorize('ADMIN', 'MANAGER', 'DISPATCHER'), getTemplates);

/**
 * GET /api/templates/:id
 * Einzelne Vorlage abrufen
 * Zugriff: ADMIN, MANAGER, DISPATCHER
 */
router.get('/:id', authorize('ADMIN', 'MANAGER', 'DISPATCHER'), getTemplateById);

/**
 * POST /api/templates
 * Neue Vorlage erstellen
 * Zugriff: ADMIN only
 */
router.post('/', authorize('ADMIN'), createTemplate);

/**
 * PUT /api/templates/:id
 * Vorlage aktualisieren
 * Zugriff: ADMIN only
 */
router.put('/:id', authorize('ADMIN'), updateTemplate);

/**
 * DELETE /api/templates/:id
 * Vorlage löschen/deaktivieren
 * Zugriff: ADMIN only
 * Query param: permanent=true für permanentes Löschen
 */
router.delete('/:id', authorize('ADMIN'), deleteTemplate);

export default router;
