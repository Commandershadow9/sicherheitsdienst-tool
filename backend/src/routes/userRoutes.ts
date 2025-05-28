import { Router } from 'express';
import { 
  getAllUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deactivateUser 
} from '../controllers/userController';

const router = Router();

// GET /api/users - Alle Mitarbeiter
router.get('/', getAllUsers);

// POST /api/users - Neuen Mitarbeiter erstellen
router.post('/', createUser);

// GET /api/users/:id - Einzelnen Mitarbeiter
router.get('/:id', getUserById);

// PUT /api/users/:id - Mitarbeiter aktualisieren
router.put('/:id', updateUser);

// DELETE /api/users/:id - Mitarbeiter deaktivieren
router.delete('/:id', deactivateUser);

export default router;