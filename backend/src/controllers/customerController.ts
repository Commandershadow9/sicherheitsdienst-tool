import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/customers
 * Liste aller Kunden (mit optionalem Search-Parameter)
 */
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, limit, offset } = req.query;

    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { companyName: { contains: search as string, mode: 'insensitive' } },
            { industry: { contains: search as string, mode: 'insensitive' } },
            { city: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          sites: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { companyName: 'asc' },
        take: limit ? parseInt(limit as string) : undefined,
        skip: offset ? parseInt(offset as string) : undefined,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers,
      total,
      limit: limit ? parseInt(limit as string) : customers.length,
      offset: offset ? parseInt(offset as string) : 0,
    });
    return;
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kunden' });
    return;
  }
};

/**
 * GET /api/customers/:id
 * Einzelnen Kunden abrufen
 */
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sites: {
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Kunde nicht gefunden' });
      return;
    }

    res.json(customer);
    return;
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Kunden' });
    return;
  }
};

/**
 * POST /api/customers
 * Neuen Kunden anlegen
 */
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyName,
      industry,
      taxId,
      primaryContact,
      contacts,
      address,
      city,
      postalCode,
      country,
      billingAddress,
      paymentTerms,
      discount,
      notes,
    } = req.body;

    // Validierung
    if (!companyName || !address || !city || !postalCode) {
      res.status(400).json({
        error: 'Firmenname, Adresse, Stadt und PLZ sind Pflichtfelder',
      });
      return;
    }

    if (!primaryContact || !primaryContact.name || !primaryContact.email) {
      res.status(400).json({
        error: 'Primärer Ansprechpartner mit Name und Email ist erforderlich',
      });
      return;
    }

    // Prüfen ob Firmenname bereits existiert
    const existingCustomer = await prisma.customer.findUnique({
      where: { companyName },
    });

    if (existingCustomer) {
      res.status(409).json({
        error: 'Ein Kunde mit diesem Firmennamen existiert bereits',
      });
      return;
    }

    // Prüfen ob TaxID bereits existiert (falls angegeben)
    if (taxId) {
      const existingTaxId = await prisma.customer.findUnique({
        where: { taxId },
      });

      if (existingTaxId) {
        res.status(409).json({
          error: 'Ein Kunde mit dieser Steuernummer existiert bereits',
        });
        return;
      }
    }

    const customer = await prisma.customer.create({
      data: {
        companyName,
        industry,
        taxId,
        primaryContact,
        contacts: contacts || [],
        address,
        city,
        postalCode,
        country: country || 'Deutschland',
        billingAddress,
        paymentTerms: paymentTerms || '30 Tage netto',
        discount: discount ? parseFloat(discount) : null,
        notes,
      },
      include: {
        sites: true,
      },
    });

    res.status(201).json(customer);
    return;
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({
          error: 'Ein Kunde mit diesen Daten existiert bereits',
        });
        return;
      }
    }

    res.status(500).json({ error: 'Fehler beim Anlegen des Kunden' });
    return;
  }
};

/**
 * PUT /api/customers/:id
 * Kunden aktualisieren
 */
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      companyName,
      industry,
      taxId,
      primaryContact,
      contacts,
      address,
      city,
      postalCode,
      country,
      billingAddress,
      paymentTerms,
      discount,
      notes,
    } = req.body;

    // Prüfen ob Kunde existiert
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      res.status(404).json({ error: 'Kunde nicht gefunden' });
      return;
    }

    // Prüfen ob neuer Firmenname bereits existiert (bei anderem Kunden)
    if (companyName && companyName !== existingCustomer.companyName) {
      const duplicateCompanyName = await prisma.customer.findFirst({
        where: {
          companyName,
          id: { not: id },
        },
      });

      if (duplicateCompanyName) {
        res.status(409).json({
          error: 'Ein anderer Kunde mit diesem Firmennamen existiert bereits',
        });
        return;
      }
    }

    // Prüfen ob neue TaxID bereits existiert (bei anderem Kunden)
    if (taxId && taxId !== existingCustomer.taxId) {
      const duplicateTaxId = await prisma.customer.findFirst({
        where: {
          taxId,
          id: { not: id },
        },
      });

      if (duplicateTaxId) {
        res.status(409).json({
          error: 'Ein anderer Kunde mit dieser Steuernummer existiert bereits',
        });
        return;
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        companyName,
        industry,
        taxId,
        primaryContact,
        contacts,
        address,
        city,
        postalCode,
        country,
        billingAddress,
        paymentTerms,
        discount: discount ? parseFloat(discount) : null,
        notes,
      },
      include: {
        sites: true,
      },
    });

    res.json(customer);
    return;
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({
          error: 'Ein Kunde mit diesen Daten existiert bereits',
        });
        return;
      }
    }

    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kunden' });
    return;
  }
};

/**
 * DELETE /api/customers/:id
 * Kunden löschen
 */
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prüfen ob Kunde existiert
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sites: true,
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Kunde nicht gefunden' });
      return;
    }

    // Prüfen ob Kunde noch Objekte hat
    if (customer.sites && customer.sites.length > 0) {
      res.status(409).json({
        error: `Kunde kann nicht gelöscht werden. Es sind noch ${customer.sites.length} Objekt(e) zugeordnet.`,
      });
      return;
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.status(204).send();
    return;
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kunden' });
    return;
  }
};

/**
 * GET /api/customers/search
 * Fuzzy Search für Kunden (für Wizard)
 */
export const searchCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      res.json({ customers: [] });
      return;
    }

    const searchTerm = q as string;

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { postalCode: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        companyName: true,
        industry: true,
        primaryContact: true,
        address: true,
        city: true,
        postalCode: true,
        _count: {
          select: {
            sites: true,
          },
        },
      },
      take: 10,
      orderBy: { companyName: 'asc' },
    });

    res.json({ customers });
    return;
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Fehler bei der Kundensuche' });
    return;
  }
};
