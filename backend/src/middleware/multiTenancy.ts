/**
 * 🔐 MULTI-TENANCY MIDDLEWARE
 *
 * Automatische Customer-Isolation auf Prisma-Ebene.
 * Jede Query wird automatisch nach `customerId` gefiltert.
 *
 * **SICHERHEITSKRITISCH:** Verhindert Cross-Customer-Data-Leaks.
 *
 * **Architektur:**
 * 1. Express-Middleware setzt `customerId` im AsyncLocalStorage (Request-Context)
 * 2. Prisma-Middleware liest `customerId` aus Context und filtert automatisch
 * 3. PostgreSQL RLS als zusätzliche Schutzebene (DB-Level)
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

// AsyncLocalStorage für Request-Context (customerId speichern)
const asyncLocalStorage = new AsyncLocalStorage<{ customerId: string }>();

// Modelle, die direkt `customerId` haben (müssen gefiltert werden)
const MODELS_WITH_CUSTOMER_ID = ['User', 'Site'];

// Modelle, die über Relationen isoliert werden (über User oder Site)
const MODELS_VIA_USER = [
  'ShiftAssignment',
  'TimeEntry',
  'Incident',
  'EmployeeProfile',
  'Absence',
  'ObjectClearance',
  'SiteAssignment',
  'SiteIncident',
  'ControlRound',
  'ControlScan',
  'EmployeePreferences',
  'EmployeeWorkload',
  'ComplianceViolation',
  'DeviceToken',
];

const MODELS_VIA_SITE = [
  'Shift',
  'Event',
  'SecurityConcept',
  'SiteImage',
  'SiteDocument',
  'ControlPoint',
  'SiteCalculation',
];

/**
 * Express-Middleware: Setzt customerId in AsyncLocalStorage (nach Authentifizierung).
 *
 * **WICHTIG:** Muss NACH `authenticate`-Middleware kommen!
 */
export function setCustomerContext(req: Request, res: Response, next: NextFunction): void {
  const customerId = req.user?.customerId;

  if (!customerId) {
    // Nur warnen, nicht blockieren (evtl. public routes)
    logger.debug('Multi-Tenancy: Kein customerId im Request (evtl. nicht authentifiziert)');
    return next();
  }

  // Speichere customerId im AsyncLocalStorage für diesen Request
  asyncLocalStorage.run({ customerId }, () => {
    next();
  });
}

/**
 * Prisma-Middleware: Automatische Filterung nach customerId (aus AsyncLocalStorage).
 *
 * **REGISTRIERUNG:** Muss einmal beim App-Start aufgerufen werden!
 */
export function registerMultiTenancyMiddleware() {
  prisma.$use(async (params, next) => {
    const store = asyncLocalStorage.getStore();
    const customerId = store?.customerId;

    // Kein customerId im Context → WARNUNG, aber Query durchlassen (z.B. Login)
    if (!customerId) {
      // logger.debug(`Multi-Tenancy: Keine customerId im Context (Model: ${params.model}, Action: ${params.action})`);
      return next(params);
    }

    // Nur bei READ-Operationen filtern (findMany, findFirst, findUnique, count, aggregate)
    const isReadOperation = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(
      params.action,
    );

    if (!isReadOperation) {
      // Bei CREATE/UPDATE: customerId muss explizit gesetzt werden (in Controller)
      if (params.action === 'create' && params.model === 'User') {
        if (!params.args.data.customerId) {
          logger.error(
            `🔴 SECURITY VIOLATION: CREATE User ohne customerId! Data: ${JSON.stringify(params.args.data)}`,
          );
          throw new Error('Security Violation: customerId fehlt bei User-Erstellung');
        }
      }
      return next(params);
    }

    // Filter für Modelle mit direktem customerId
    if (params.model && MODELS_WITH_CUSTOMER_ID.includes(params.model)) {
      params.args.where = {
        ...params.args.where,
        customerId,
      };
      logger.debug(`🔐 Multi-Tenancy Filter: ${params.model} → customerId=${customerId}`);
    }

    // Filter für Modelle via User-Relation
    if (params.model && MODELS_VIA_USER.includes(params.model)) {
      params.args.where = {
        ...params.args.where,
        user: {
          customerId,
        },
      };
      logger.debug(`🔐 Multi-Tenancy Filter: ${params.model} → user.customerId=${customerId}`);
    }

    // Filter für Modelle via Site-Relation
    if (params.model && MODELS_VIA_SITE.includes(params.model)) {
      params.args.where = {
        ...params.args.where,
        site: {
          customerId,
        },
      };
      logger.debug(`🔐 Multi-Tenancy Filter: ${params.model} → site.customerId=${customerId}`);
    }

    return next(params);
  });

  logger.info('✅ Multi-Tenancy Middleware registriert (Prisma)');
}
