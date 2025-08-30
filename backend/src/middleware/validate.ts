import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod'; // ZodError importieren

// Kein logger Import hier

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => { // Expliziter Rückgabetyp
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError) { // Prüfen ob es ein ZodError ist
        return res.status(400).json({ // Rückgabe hier
          success: false,
          message: 'Validierungsfehler',
          errors: error.errors
        });
      }
      // Für andere Fehler, die hier unerwartet auftreten könnten
      console.error("Error in validation middleware:", error);
      return res.status(500).json({ // Rückgabe hier
        success: false,
        message: "Ein unerwarteter Fehler ist im Validierungs-Middleware aufgetreten."
      });
    }
  };
};