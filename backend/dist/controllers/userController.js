"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateUser = exports.updateUser = exports.getUserById = exports.createUser = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// GET /api/users - Alle Mitarbeiter abrufen
const getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                employeeId: true,
                isActive: true,
                hireDate: true,
                qualifications: true,
                createdAt: true
                // password excluded for security
            },
            orderBy: {
                firstName: 'asc'
            }
        });
        res.json({
            success: true,
            message: `${users.length} Mitarbeiter aus Datenbank geladen`,
            data: users,
            count: users.length
        });
    }
    catch (error) {
        console.error('Error fetching users from database:', error);
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
// POST /api/users - Neuen Mitarbeiter erstellen
const createUser = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phone, role = 'EMPLOYEE', employeeId, hireDate, qualifications = [] } = req.body;
        // Validation
        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({
                success: false,
                message: 'Email, Passwort, Vorname und Nachname sind erforderlich'
            });
            return;
        }
        // Password hashen
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role: role, // TypeScript-Fix für Enum
                employeeId,
                hireDate: hireDate ? new Date(hireDate) : null,
                qualifications: Array.isArray(qualifications) ? qualifications : []
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                employeeId: true,
                isActive: true,
                hireDate: true,
                qualifications: true,
                createdAt: true
            }
        });
        res.status(201).json({
            success: true,
            message: 'Mitarbeiter erfolgreich in Datenbank erstellt',
            data: user
        });
    }
    catch (error) {
        console.error('Error creating user in database:', error);
        // Prisma unique constraint error
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'E-Mail oder Mitarbeiter-ID bereits in Datenbank vergeben'
            });
            return;
        }
        next(error);
    }
};
exports.createUser = createUser;
// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                employeeId: true,
                isActive: true,
                hireDate: true,
                qualifications: true,
                createdAt: true,
                shifts: {
                    include: {
                        shift: {
                            select: {
                                id: true,
                                title: true,
                                startTime: true,
                                endTime: true,
                                location: true,
                                status: true
                            }
                        }
                    }
                },
                timeEntries: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                        breakTime: true,
                        notes: true
                    },
                    orderBy: {
                        startTime: 'desc'
                    },
                    take: 10 // Letzte 10 Einträge
                }
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Mitarbeiter nicht in Datenbank gefunden'
            });
            return;
        }
        res.json({
            success: true,
            message: `Mitarbeiter ${user.firstName} ${user.lastName} aus Datenbank geladen`,
            data: user
        });
    }
    catch (error) {
        console.error('Error fetching user from database:', error);
        next(error);
    }
};
exports.getUserById = getUserById;
// PUT /api/users/:id - Mitarbeiter aktualisieren
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, phone, role, employeeId, hireDate, qualifications, isActive } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(email && { email }),
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(role && { role: role }),
                ...(employeeId !== undefined && { employeeId }),
                ...(hireDate && { hireDate: new Date(hireDate) }),
                ...(qualifications && { qualifications: Array.isArray(qualifications) ? qualifications : [] }),
                ...(isActive !== undefined && { isActive })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                employeeId: true,
                isActive: true,
                hireDate: true,
                qualifications: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            message: 'Mitarbeiter erfolgreich aktualisiert',
            data: updatedUser
        });
    }
    catch (error) {
        console.error('Error updating user in database:', error);
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'E-Mail oder Mitarbeiter-ID bereits vergeben'
            });
            return;
        }
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Mitarbeiter nicht gefunden'
            });
            return;
        }
        next(error);
    }
};
exports.updateUser = updateUser;
// DELETE /api/users/:id - Mitarbeiter deaktivieren (soft delete)
const deactivateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deactivatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true
            }
        });
        res.json({
            success: true,
            message: 'Mitarbeiter erfolgreich deaktiviert',
            data: deactivatedUser
        });
    }
    catch (error) {
        console.error('Error deactivating user:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Mitarbeiter nicht gefunden'
            });
            return;
        }
        next(error);
    }
};
exports.deactivateUser = deactivateUser;
