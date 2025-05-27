import { Request, Response, NextFunction } from 'express';
// Ggf. Prisma Client importieren, falls hier direkte DB-Aufrufe erfolgen sollen
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient(); // Instanz erstellen, wenn Prisma hier verwendet wird

// GET /api/users - Alle Mitarbeiter abrufen
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Beispiel für eine asynchrone Operation (ersetze dies mit deiner echten Logik, z.B. Prisma-Aufruf)
    // const users = await prisma.user.findMany();

    // Aktuelle Test-Antwort
    res.json({
      success: true,
      message: 'API funktioniert! (async)',
      data: [
        {
          id: '1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        }
      ],
      count: 1
      // data: users, // Wenn du echte Daten von Prisma holst
      // count: users.length // Wenn du echte Daten von Prisma holst
    });
  } catch (error) {
    // Fehler an die zentrale Fehlerbehandlung in app.ts weiterleiten
    next(error);
  }
};

// POST /api/users - Neuen Mitarbeiter erstellen
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Beispiel für eine asynchrone Operation (ersetze dies mit deiner echten Logik, z.B. Prisma-Aufruf)
    // Beachte: Für das Erstellen eines Benutzers benötigst du normalerweise mehr Felder,
    // insbesondere ein gehashtes Passwort.
    // const newUser = await prisma.user.create({
    //   data: {
    //     firstName,
    //     lastName,
    //     email,
    //     password: 'ein_sicher_gehashtes_passwort', // Beispiel!
    //     // weitere benötigte Felder gemäß deinem Prisma Schema
    //   },
    // });

    // Aktuelle Test-Antwort
    res.status(201).json({
      success: true,
      message: 'Test: Mitarbeiter würde erstellt werden (async)',
      data: {
        id: '2', // Dies würde normalerweise von der Datenbank generiert
        firstName,
        lastName,
        email
        // ...newUser // Gib hier die Daten des neu erstellten Benutzers zurück
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Beispiel für eine asynchrone Operation (ersetze dies mit deiner echten Logik, z.B. Prisma-Aufruf)
    // const user = await prisma.user.findUnique({
    //   where: { id },
    // });

    // if (!user) {
    //   res.status(404).json({ success: false, message: `Mitarbeiter mit ID ${id} nicht gefunden.` });
    //   return; // Wichtig: Beende die Funktion hier, da die Antwort gesendet wurde.
    // }

    // Aktuelle Test-Antwort
    res.json({
      success: true,
      message: `Test: Mitarbeiter ${id} gefunden (async)`,
      data: {
        id, // Behalte die ID aus den Parametern für die Test-Antwort
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
        // ...user // Gib hier die Daten des gefundenen Benutzers zurück
      }
    });
  } catch (error) {
    next(error);
  }
};