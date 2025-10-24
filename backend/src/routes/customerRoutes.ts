import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Alle Routes benötigen Authentifizierung
router.use(authenticate);

/**
 * GET /api/customers/search
 * Fuzzy Search für Kunden (für Wizard)
 * Zugriff: ADMIN, MANAGER, DISPATCHER
 */
router.get(
  '/search',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  searchCustomers
);

/**
 * GET /api/customers
 * Liste aller Kunden
 * Zugriff: ADMIN, MANAGER, DISPATCHER
 */
router.get(
  '/',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  getCustomers
);

/**
 * GET /api/customers/:id
 * Einzelnen Kunden abrufen
 * Zugriff: ADMIN, MANAGER, DISPATCHER
 */
router.get(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  getCustomerById
);

/**
 * POST /api/customers
 * Neuen Kunden anlegen
 * Zugriff: ADMIN, MANAGER
 */
router.post('/', authorize('ADMIN', 'MANAGER'), createCustomer);

/**
 * PUT /api/customers/:id
 * Kunden aktualisieren
 * Zugriff: ADMIN, MANAGER
 */
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateCustomer);

/**
 * DELETE /api/customers/:id
 * Kunden löschen
 * Zugriff: ADMIN only
 */
router.delete('/:id', authorize('ADMIN'), deleteCustomer);

export default router;
