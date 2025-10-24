const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUrgentShiftToday() {
  try {
    console.log('\n🚨 Erstelle DRINGENDE Schicht für HEUTE...\n');

    // Finde ein Objekt
    const site = await prisma.site.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!site) {
      console.log('❌ Kein aktives Objekt gefunden!');
      return;
    }

    const now = new Date();

    // Erstelle eine Schicht, die in 2 Stunden beginnt (HEUTE!)
    let startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 Stunden
    let endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000); // +8 Stunden

    // WICHTIG: Stelle sicher, dass die Schicht HEUTE beginnt
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (startTime >= tomorrow) {
      console.log('⚠️  Die berechnete Startzeit wäre morgen. Setze Startzeit auf 23:00 Uhr heute.');
      const todayAt23 = new Date(today);
      todayAt23.setHours(23, 0, 0, 0);
      startTime = todayAt23;
      endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);
    }

    const shift = await prisma.shift.create({
      data: {
        title: '🚨 EILIG: Nachtschicht - UNBESETZT!',
        description: 'KRITISCH: Mitarbeiter ausgefallen! Sofortige Besetzung erforderlich. Keine Qualifikationen vorhanden!',
        location: `${site.name} - ${site.address}`,
        startTime: startTime,
        endTime: endTime,
        requiredEmployees: 2, // 2 benötigt, aber 0 zugewiesen!
        requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
        status: 'PLANNED',
        siteId: site.id,
      },
    });

    console.log(`✅ KRITISCHE Schicht für HEUTE erstellt:`);
    console.log(`   ID: ${shift.id}`);
    console.log(`   Titel: ${shift.title}`);
    console.log(`   Beginn: ${shift.startTime.toLocaleString('de-DE')}`);
    console.log(`   Ende: ${shift.endTime.toLocaleString('de-DE')}`);
    console.log(`   Status: ${shift.status}`);
    console.log(`   Benötigte Mitarbeiter: ${shift.requiredEmployees}`);
    console.log(`   Zugewiesene Mitarbeiter: 0`);
    console.log(`   Standort: ${shift.location}`);

    const hoursUntilStart = Math.round((shift.startTime - now) / (1000 * 60 * 60));
    console.log(`\n🚨 KRITISCH: Schicht beginnt in ${hoursUntilStart} Stunden!`);
    console.log(`   → Dashboard sollte jetzt "Heute kritisch (1)" anzeigen!\n`);

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUrgentShiftToday();
