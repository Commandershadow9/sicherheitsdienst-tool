import { User } from '@prisma/client'; // Stellt sicher, dass User von Prisma importiert wird

declare global {
  namespace Express {
    interface Request {
      user?: User; // Hier deklarieren wir, dass das Request-Objekt optional einen User haben kann
      id?: string; // Request-ID für Log-Korrelation
    }
  }
}
