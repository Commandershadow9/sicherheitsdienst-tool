import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth'; // NEU: authenticate importieren
// Optional: authorize für rollenbasierten Zugriff
// import { authorize } from '../middleware/auth';
// import { Role } from '@prisma/client'; // Falls du Role Enum von Prisma für authorize nutzt

const router = Router();

// Alle folgenden Routen erfordern jetzt Authentifizierung

// GET /api/users - Alle Mitarbeiter abrufen
// Beispiel: Nur Admins und Dispatcher dürfen alle User sehen
// router.get('/', authenticate, authorize('ADMIN', 'DISPATCHER'), asyncHandler(userController.getAllUsers));
router.get('/', authenticate, asyncHandler(userController.getAllUsers)); // Vorerst nur Authentifizierung

// POST /api/users - Neuen Mitarbeiter erstellen
// Beispiel: Nur Admins dürfen neue User erstellen
// router.post('/', authenticate, authorize('ADMIN'), asyncHandler(userController.createUser));
router.post('/', authenticate, asyncHandler(userController.createUser)); // Vorerst nur Authentifizierung

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
// Erlaubt dem Admin, jeden User abzurufen, oder einem User, sein eigenes Profil abzurufen (komplexere Logik im Controller nötig)
router.get('/:id', authenticate, asyncHandler(userController.getUserById));

// PUT /api/users/:id - Mitarbeiter aktualisieren
// Ähnlich wie oben, Admin darf alle, User evtl. nur sich selbst
router.put('/:id', authenticate, asyncHandler(userController.updateUser));

// DELETE /api/users/:id - Mitarbeiter deaktivieren (soft delete)
// Beispiel: Nur Admins dürfen User deaktivieren
// router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(userController.deactivateUser));
router.delete('/:id', authenticate, asyncHandler(userController.deactivateUser)); // Vorerst nur Authentifizierung
export default router;
