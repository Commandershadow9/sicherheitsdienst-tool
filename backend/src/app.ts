import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.MOBILE_APP_URL || 'http://localhost:19000'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sicherheitsdienst-Tool Backend is running',
    timestamp: new Date().toISOString()
  });
});

// USER ROUTES - ECHTE DATENBANK-OPERATIONEN

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
  } catch (error) {
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
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'EMPLOYEE',
      employeeId,
      hireDate,
      qualifications = []
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, Passwort, Vorname und Nachname sind erforderlich'
      });
    }

    // Password hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role as any, // TypeScript-Fix für Enum
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
  } catch (error: any) {
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
  } catch (error) {
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
  } catch (error) {
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
    message: 'Die angeforderte Ressource wurde nicht gefunden.' 
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Interner Serverfehler',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('👋 Prisma disconnected');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📅 Shifts API: http://localhost:${PORT}/api/shifts`);
  console.log(`🎯 Prisma Studio: http://localhost:5555`);
});

export default app;