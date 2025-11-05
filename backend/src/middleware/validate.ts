import type { RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject): RequestHandler => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Validierungsfehler.',
          errors: error.errors,
        });
        return;
      }
      // Unerwartete Fehler dem globalen Error-Handler übergeben
      next(error);
    }
  };
};
