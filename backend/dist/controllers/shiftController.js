"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignUserToShift = exports.deleteShift = exports.updateShift = exports.getShiftById = exports.createShift = exports.getAllShifts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET /api/shifts - Alle Schichten abrufen
const getAllShifts = async (req, res, next) => {
    try {
        const shifts = await prisma.shift.findMany({
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeId: true,
                                phone: true,
                                qualifications: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
        res.json({
            success: true,
            message: `${shifts.length} Schichten aus Datenbank geladen`,
            data: shifts,
            count: shifts.length
        });
    }
    catch (error) {
        console.error('Error fetching shifts from database:', error);
        next(error);
    }
};
exports.getAllShifts = getAllShifts;
// POST /api/shifts - Neue Schicht erstellen
const createShift = async (req, res, next) => {
    try {
        const { title, description, location, startTime, endTime, requiredEmployees = 1, requiredQualifications = [] } = req.body;
        // Validation
        if (!title || !location || !startTime || !endTime) {
            res.status(400).json({
                success: false,
                message: 'Titel, Ort, Start- und Endzeit sind erforderlich'
            });
            return;
        }
        // Zeitvalidierung
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (start >= end) {
            res.status(400).json({
                success: false,
                message: 'Startzeit muss vor der Endzeit liegen'
            });
            return;
        }
        const shift = await prisma.shift.create({
            data: {
                title,
                description,
                location,
                startTime: start,
                endTime: end,
                requiredEmployees: parseInt(requiredEmployees),
                requiredQualifications: Array.isArray(requiredQualifications) ? requiredQualifications : []
            },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeId: true
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Schicht erfolgreich erstellt',
            data: shift
        });
    }
    catch (error) {
        console.error('Error creating shift:', error);
        next(error);
    }
};
exports.createShift = createShift;
// GET /api/shifts/:id - Einzelne Schicht abrufen
const getShiftById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const shift = await prisma.shift.findUnique({
            where: { id },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeId: true,
                                phone: true,
                                qualifications: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        if (!shift) {
            res.status(404).json({
                success: false,
                message: 'Schicht nicht gefunden'
            });
            return;
        }
        res.json({
            success: true,
            message: `Schicht "${shift.title}" geladen`,
            data: shift
        });
    }
    catch (error) {
        console.error('Error fetching shift:', error);
        next(error);
    }
};
exports.getShiftById = getShiftById;
// PUT /api/shifts/:id - Schicht aktualisieren
const updateShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, location, startTime, endTime, requiredEmployees, requiredQualifications, status } = req.body;
        // Zeitvalidierung falls beide Zeiten angegeben werden
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (start >= end) {
                res.status(400).json({
                    success: false,
                    message: 'Startzeit muss vor der Endzeit liegen'
                });
                return;
            }
        }
        const updatedShift = await prisma.shift.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(location && { location }),
                ...(startTime && { startTime: new Date(startTime) }),
                ...(endTime && { endTime: new Date(endTime) }),
                ...(requiredEmployees && { requiredEmployees: parseInt(requiredEmployees) }),
                ...(requiredQualifications && {
                    requiredQualifications: Array.isArray(requiredQualifications) ? requiredQualifications : []
                }),
                ...(status && { status: status })
            },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeId: true
                            }
                        }
                    }
                }
            }
        });
        res.json({
            success: true,
            message: 'Schicht erfolgreich aktualisiert',
            data: updatedShift
        });
    }
    catch (error) {
        console.error('Error updating shift:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Schicht nicht gefunden'
            });
            return;
        }
        next(error);
    }
};
exports.updateShift = updateShift;
// DELETE /api/shifts/:id - Schicht löschen
const deleteShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Erst alle Zuweisungen löschen
        await prisma.shiftAssignment.deleteMany({
            where: { shiftId: id }
        });
        // Dann die Schicht löschen
        const deletedShift = await prisma.shift.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Schicht erfolgreich gelöscht',
            data: { id: deletedShift.id, title: deletedShift.title }
        });
    }
    catch (error) {
        console.error('Error deleting shift:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Schicht nicht gefunden'
            });
            return;
        }
        next(error);
    }
};
exports.deleteShift = deleteShift;
// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
const assignUserToShift = async (req, res, next) => {
    try {
        const { id: shiftId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'Benutzer-ID ist erforderlich'
            });
            return;
        }
        // Prüfen ob Schicht existiert
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
            include: { assignments: true }
        });
        if (!shift) {
            res.status(404).json({
                success: false,
                message: 'Schicht nicht gefunden'
            });
            return;
        }
        // Prüfen ob bereits zugewiesen
        const existingAssignment = await prisma.shiftAssignment.findUnique({
            where: {
                userId_shiftId: {
                    userId,
                    shiftId
                }
            }
        });
        if (existingAssignment) {
            res.status(400).json({
                success: false,
                message: 'Mitarbeiter ist bereits dieser Schicht zugewiesen'
            });
            return;
        }
        // Zuweisung erstellen
        const assignment = await prisma.shiftAssignment.create({
            data: {
                userId,
                shiftId,
                status: 'ASSIGNED'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true
                    }
                },
                shift: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        endTime: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Mitarbeiter erfolgreich zur Schicht zugewiesen',
            data: assignment
        });
    }
    catch (error) {
        console.error('Error assigning user to shift:', error);
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'Mitarbeiter ist bereits dieser Schicht zugewiesen'
            });
            return;
        }
        next(error);
    }
};
exports.assignUserToShift = assignUserToShift;
