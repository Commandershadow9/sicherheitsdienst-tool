"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma Client
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.MOBILE_APP_URL || 'http://localhost:19000'
    ],
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Welcome Route
app.get('/', (req, res) => {
    res.json({
        message: '🛡️ Sicherheitsdienst-Tool Backend API',
        version: '1.0.0',
        status: 'Running',
        endpoints: {
            health: '/api/health',
            users: '/api/users',
            shifts: '/api/shifts'
        },
        timestamp: new Date().toISOString()
    });
});
// HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        // Datenbankverbindung testen
        await prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'OK',
            message: 'Sicherheitsdienst-Tool Backend is running',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'ERROR',
            message: 'Database connection failed',
            timestamp: new Date().toISOString(),
            database: 'Disconnected'
        });
    }
});
// USER ROUTES - INLINE (WORKING SOLUTION)
// GET /api/users - Alle Mitarbeiter aus der Datenbank abrufen
app.get('/api/users', async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Mitarbeiter aus der Datenbank',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
// POST /api/users - Neuen Mitarbeiter in die Datenbank erstellen
app.post('/api/users', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role = 'EMPLOYEE', employeeId, hireDate, qualifications = [] } = req.body;
        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Email, Passwort, Vorname und Nachname sind erforderlich'
            });
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
            return res.status(400).json({
                success: false,
                message: 'E-Mail oder Mitarbeiter-ID bereits in Datenbank vergeben'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Fehler beim Erstellen des Mitarbeiters in der Datenbank',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// GET /api/users/:id - Einzelnen Mitarbeiter aus der Datenbank abrufen
app.get('/api/users/:id', async (req, res) => {
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
            return res.status(404).json({
                success: false,
                message: 'Mitarbeiter nicht in Datenbank gefunden'
            });
        }
        res.json({
            success: true,
            message: `Mitarbeiter ${user.firstName} ${user.lastName} aus Datenbank geladen`,
            data: user
        });
    }
    catch (error) {
        console.error('Error fetching user from database:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen des Mitarbeiters aus der Datenbank',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
// GET /api/shifts - Alle Schichten aus der Datenbank
app.get('/api/shifts', async (req, res) => {
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
                                employeeId: true
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
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Schichten aus der Datenbank'
        });
    }
});
// 404 handler for unmatched routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Die angeforderte Ressource '${req.originalUrl}' wurde nicht gefunden.`,
        availableEndpoints: [
            'GET /api/health',
            'GET /api/users',
            'POST /api/users',
            'GET /api/users/:id',
            'GET /api/shifts'
        ]
    });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🚨 Server Error:', err.stack);
    // Prisma Error Handling
    if (err.code?.startsWith('P')) {
        return res.status(400).json({
            success: false,
            message: 'Datenbankfehler',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Ein Datenbankfehler ist aufgetreten'
        });
    }
    // Validation Error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validierungsfehler',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Ungültige Eingabedaten'
        });
    }
    // Default Error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Interner Serverfehler',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
});
// Graceful Shutdown
const gracefulShutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    console.log('👋 Prisma disconnected');
    process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
// Start Server
app.listen(PORT, () => {
    console.log('🚀 ================================');
    console.log(`🛡️  Sicherheitsdienst-Tool Backend`);
    console.log('🚀 ================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('📍 Available Endpoints:');
    console.log(`   ├─ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   ├─ Users API:    http://localhost:${PORT}/api/users`);
    console.log(`   └─ Shifts API:   http://localhost:${PORT}/api/shifts`);
    console.log('');
    console.log('🛠️  Development Tools:');
    console.log(`   ├─ Prisma Studio: http://localhost:5555`);
    console.log(`   └─ pgAdmin:       http://localhost:8080`);
    console.log('🚀 ================================');
});
exports.default = app;
