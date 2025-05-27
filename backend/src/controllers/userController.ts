import { Request, Response } from 'express';

// GET /api/users - Alle Mitarbeiter abrufen (Test-Version)
export const getAllUsers = (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'API funktioniert!',
    data: [
      {
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      }
    ],
    count: 1
  });
};

// POST /api/users - Neuen Mitarbeiter erstellen (Test-Version)
export const createUser = (req: Request, res: Response): void => {
  const { firstName, lastName, email } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Test: Mitarbeiter würde erstellt werden',
    data: {
      id: '2',
      firstName,
      lastName,
      email
    }
  });
};

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen (Test-Version)
export const getUserById = (req: Request, res: Response): void => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `Test: Mitarbeiter ${id} gefunden`,
    data: {
      id,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    }
  });
};