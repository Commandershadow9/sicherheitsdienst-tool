/**
 * Seed-Script für Schichtplanung v2.0 Testdaten
 *
 * Ausführung:
 * npx tsx backend/seed-shift-planning-v2.ts
 *
 * Oder mit spezifischer Customer-ID:
 * TEST_CUSTOMER_ID=your-customer-id npx tsx backend/seed-shift-planning-v2.ts
 */

import { PrismaClient } from '@prisma/client';
import { seedShiftPlanningV2 } from './src/utils/seedShiftPlanningV2';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SCHICHTPLANUNG V2.0 - TESTDATEN SEED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Hole oder erstelle Test-Customer
  let customer = await prisma.customer.findFirst({
    where: { companyName: 'Testfirma Schichtplanung' },
  });

  if (!customer) {
    console.log('📝 Erstelle Test-Customer...');
    customer = await prisma.customer.create({
      data: {
        companyName: 'Testfirma Schichtplanung',
        address: 'Teststraße 1',
        city: 'Teststadt',
        postalCode: '12345',
        country: 'Deutschland',
        primaryContact: {
          name: 'Test Admin',
          email: 'admin@testfirma.de',
          phone: '+49 123 456789',
          position: 'Geschäftsführer',
        },
      },
    });
    console.log(`✅ Test-Customer erstellt: ${customer.id}\n`);
  } else {
    console.log(`✅ Test-Customer gefunden: ${customer.id}\n`);
  }

  // Seed Schichtplanung v2.0 Daten
  await seedShiftPlanningV2(customer.id);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ SEED ERFOLGREICH ABGESCHLOSSEN!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Du kannst jetzt folgendes testen:');
  console.log('');
  console.log('  1. Dashboard:');
  console.log('     - Alle 9 Konflikttypen visualisiert');
  console.log('     - Stats-Karten mit Critical/High/Medium/Low');
  console.log('');
  console.log('  2. Matrix mit Drag & Drop:');
  console.log('     - Clearance-Badges (Grün/Orange/Rot)');
  console.log('     - Inline Compliance-Warnungen');
  console.log('     - Touch-Support (Mobile)');
  console.log('');
  console.log('  3. Timeline:');
  console.log('     - Clearance-Ring-Indikatoren');
  console.log('     - Doppel-Buchungen sichtbar');
  console.log('     - Ruhezeit-Verstöße erkennbar');
  console.log('');
  console.log('  4. Auto-Fill:');
  console.log('     - Preview-Modus mit verschiedenen Kandidaten');
  console.log('     - Score-basiertes Ranking (OPTIMAL/GOOD/ACCEPTABLE)');
  console.log('     - Verschiedene Mitarbeiter-Profile');
  console.log('');
  console.log('  5. Templates:');
  console.log('     - 7 verschiedene ShiftTypes');
  console.log('     - Template-Anwendung auf Sites');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔍 Test-Mitarbeiter Übersicht:');
  console.log('');
  console.log('  Optimal verfügbar:');
  console.log('    - max.optimal@test.de (Alle Clearances, volle Quali)');
  console.log('    - anna.perfekt@test.de (3 Sites, Event-Spezialist)');
  console.log('    - tom.verfuegbar@test.de (2 Sites, flexibel)');
  console.log('');
  console.log('  Clearance-Probleme:');
  console.log('    - lisa.noclearance@test.de (KEINE Clearance)');
  console.log('    - peter.expired@test.de (EXPIRED Clearance)');
  console.log('    - sarah.expiring@test.de (Läuft bald ab)');
  console.log('');
  console.log('  Qualifikations-Probleme:');
  console.log('    - julia.noqual@test.de (Keine Qualifikationen)');
  console.log('    - mike.teilqual@test.de (Nur Basis-Quali)');
  console.log('');
  console.log('  Compliance-Probleme:');
  console.log('    - chris.overworked@test.de (Überlastet, 52h/Woche)');
  console.log('    - emma.stressed@test.de (7 Tage durchgearbeitet)');
  console.log('');
  console.log('  Normal:');
  console.log('    - david.normal@test.de (Standard-Profil)');
  console.log('    - sophie.standard@test.de (Standard-Profil)');
  console.log('');
  console.log('🔐 Alle Passwörter: Test1234!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('');
    console.error('❌ Fehler beim Seeden:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
