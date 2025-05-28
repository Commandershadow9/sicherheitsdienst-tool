"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shiftController_1 = require("../controllers/shiftController");
const router = (0, express_1.Router)();
// GET /api/shifts - Alle Schichten
router.get('/', shiftController_1.getAllShifts);
// POST /api/shifts - Neue Schicht erstellen
router.post('/', shiftController_1.createShift);
// GET /api/shifts/:id - Einzelne Schicht
router.get('/:id', shiftController_1.getShiftById);
// PUT /api/shifts/:id - Schicht aktualisieren
router.put('/:id', shiftController_1.updateShift);
// DELETE /api/shifts/:id - Schicht löschen
router.delete('/:id', shiftController_1.deleteShift);
// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
router.post('/:id/assign', shiftController_1.assignUserToShift);
exports.default = router;
