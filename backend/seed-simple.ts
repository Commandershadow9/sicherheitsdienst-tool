/**
 * Einfaches Seed-Script für Schichtplanungs-Testdaten
 * Kompatibel mit dem aktuellen Schema
 */

import { PrismaClient } from '@prisma/client';
import { addDays, addHours, startOfWeek } from 'date-fns';
import { createUserWithPassword } from './src/utils/seedHelpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Erstelle einfache Testdaten...\n');

  // 1. Kunde erstellen
  const customer = await prisma.customer.upsert({
    where: { companyName: 'Test-Firma GmbH' },
    update: {},
    create: {
      companyName: 'Test-Firma GmbH',
      primaryContact: {
        name: 'Max Mustermann',
        email: 'info@test-firma.de',
        phone: '+49 123 456789',
        position: 'Geschäftsführer'
      },
      address: 'Musterstraße 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
      paymentTerms: '30 Tage netto'
    }
  });
  console.log('✅ Kunde erstellt:', customer.companyName);

  // 2. Test-Objekte erstellen
  const site1 = await prisma.site.create({
    data: {
      name: 'Flughafen Terminal A',
      address: 'Flughafenstraße 1',
      city: 'Frankfurt',
      postalCode: '60549',
      status: 'ACTIVE',
      buildingType: 'OTHER',
      customer: { connect: { id: customer.id } }
    }
  });

  const site2 = await prisma.site.create({
    data: {
      name: 'Shopping Mall',
      address: 'Einkaufsmeile 45',
      city: 'München',
      postalCode: '80331',
      status: 'ACTIVE',
      buildingType: 'RETAIL',
      customer: { connect: { id: customer.id } }
    }
  });
  console.log('✅ 2 Objekte erstellt');

  // 3. Test-Mitarbeiter erstellen
  const admin = await createUserWithPassword(prisma, {
    email: 'admin@test.de',
    firstName: 'Max',
    lastName: 'Admin',
    role: 'ADMIN',
    customerId: customer.id,
    password: 'Test1234!'
  });

  const employee1 = await createUserWithPassword(prisma, {
    email: 'mitarbeiter1@test.de',
    firstName: 'Anna',
    lastName: 'Müller',
    role: 'EMPLOYEE',
    customerId: customer.id,
    password: 'Test1234!'
  });

  const employee2 = await createUserWithPassword(prisma, {
    email: 'mitarbeiter2@test.de',
    firstName: 'Tom',
    lastName: 'Schmidt',
    role: 'EMPLOYEE',
    customerId: customer.id,
    password: 'Test1234!'
  });
  console.log('✅ 3 Test-Nutzer erstellt');

  // 4. Schichten erstellen
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Schicht 1: Ohne Mitarbeiter (UNASSIGNED)
  await prisma.shift.create({
    data: {
      site: { connect: { id: site1.id } },
      title: '⚠️ Frühschicht ohne Mitarbeiter',
      location: 'Haupteingang',
      startTime: addHours(weekStart, 6).toISOString(),
      endTime: addHours(weekStart, 14).toISOString(),
      requiredEmployees: 2,
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED'
    }
  });

  // Schicht 2: Mit einem Mitarbeiter (UNDERSTAFFED)
  const shift2 = await prisma.shift.create({
    data: {
      site: { connect: { id: site1.id } },
      title: '⚠️ Unterbesetzt - 1 von 3',
      location: 'Haupteingang',
      startTime: addHours(addDays(weekStart, 1), 6).toISOString(),
      endTime: addHours(addDays(weekStart, 1), 14).toISOString(),
      requiredEmployees: 3,
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED'
    }
  });

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift2.id,
      userId: employee1.id,
      status: 'ASSIGNED',
      assignedAt: new Date()
    }
  });

  // Schicht 3: Vollständig besetzt
  const shift3 = await prisma.shift.create({
    data: {
      site: { connect: { id: site2.id } },
      title: '✅ Vollständig besetzt',
      location: 'Haupteingang',
      startTime: addHours(addDays(weekStart, 2), 14).toISOString(),
      endTime: addHours(addDays(weekStart, 2), 22).toISOString(),
      requiredEmployees: 2,
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED'
    }
  });

  await prisma.shiftAssignment.createMany({
    data: [
      { shiftId: shift3.id, userId: employee1.id, status: 'ASSIGNED', assignedAt: new Date() },
      { shiftId: shift3.id, userId: employee2.id, status: 'ASSIGNED', assignedAt: new Date() }
    ]
  });

  console.log('✅ 3 Test-Schichten erstellt\n');

  console.log('═══════════════════════════════════════════════');
  console.log('🎉 Testdaten erfolgreich erstellt!');
  console.log('═══════════════════════════════════════════════');
  console.log('\n📋 Zugangsdaten:');
  console.log('  Admin:  admin@test.de / Test1234!');
  console.log('  User 1: mitarbeiter1@test.de / Test1234!');
  console.log('  User 2: mitarbeiter2@test.de / Test1234!');
  console.log('\n🌐 Frontend: http://37.114.53.56:5173');
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Fehler:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
