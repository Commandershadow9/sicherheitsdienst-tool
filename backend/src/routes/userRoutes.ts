import { Router } from 'express';
import { getAllUsers, createUser, getUserById } from '../controllers/userController';

const router = Router();

// GET /api/users - Alle Mitarbeiter
router.get('/', getAllUsers);

// POST /api/users - Neuen Mitarbeiter erstellen
router.post('/', createUser);

// GET /api/users/:id - Einzelnen Mitarbeiter
router.get('/:id', getUserById);

export default router;