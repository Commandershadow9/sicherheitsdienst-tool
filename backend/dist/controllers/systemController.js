"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStats = exports.healthCheck = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET /api/health - System Health Check
const healthCheck = async (req, res, next) => {
    try {
        // Datenbankverbindung testen
        await prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'OK',
            message: 'Sicherheitsdienst-Tool Backend is running',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            version: process.env.npm_package_version || '1.0.0',
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
};
exports.healthCheck = healthCheck;
// GET /api/stats - System Statistics
const getSystemStats = async (req, res, next) => {
    try {
        // Parallele Datenbankabfragen für bessere Performance
        const [totalUsers, activeUsers, totalShifts, upcomingShifts, openIncidents, totalTimeEntries] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.shift.count(),
            prisma.shift.count({
                where: {
                    startTime: { gte: new Date() },
                    status: { in: ['PLANNED', 'ACTIVE'] }
                }
            }),
            prisma.incident.count({
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
            }),
            prisma.timeEntry.count()
        ]);
        res.json({
            success: true,
            message: 'System-Statistiken erfolgreich abgerufen',
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers
                },
                shifts: {
                    total: totalShifts,
                    upcoming: upcomingShifts
                },
                incidents: {
                    open: openIncidents
                },
                timeEntries: {
                    total: totalTimeEntries
                },
                system: {
                    uptime: process.uptime(),
                    nodeVersion: process.version,
                    platform: process.platform,
                    memory: process.memoryUsage()
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching system stats:', error);
        next(error);
    }
};
exports.getSystemStats = getSystemStats;
