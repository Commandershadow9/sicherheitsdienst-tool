"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// GET /api/users - Alle Mitarbeiter
router.get('/', userController_1.getAllUsers);
// POST /api/users - Neuen Mitarbeiter erstellen
router.post('/', userController_1.createUser);
// GET /api/users/:id - Einzelnen Mitarbeiter
router.get('/:id', userController_1.getUserById);
// PUT /api/users/:id - Mitarbeiter aktualisieren
router.put('/:id', userController_1.updateUser);
// DELETE /api/users/:id - Mitarbeiter deaktivieren
router.delete('/:id', userController_1.deactivateUser);
exports.default = router;
