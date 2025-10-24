const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCriticalShift() {
  try {
    console.log('\n🚨 Erstelle kritische Schicht für Dashboard-Test...\n');

    // Finde ein Objekt
    const site = await prisma.site.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!site) {
      console.log('❌ Kein aktives Objekt gefunden! Bitte zuerst ein Objekt anlegen.');
      return;
    }

    // Erstelle eine Schicht, die in 6 Stunden beginnt (KRITISCH!)
    const now = new Date();
    const startTime = new Date(now.getTime() + 6 * 60 * 60 * 1000); // +6 Stunden
    const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000); // +8 Stunden (8h Schicht)

    const shift = await prisma.shift.create({
      data: {
        title: 'DRINGEND: Nachtschicht - Unbesetzt!',
        description: 'Nachtschicht im Industriegelände - Mitarbeiter hat sich kurzfristig krankgemeldet. Dringend Ersatz gesucht!',
        location: `${site.name} - ${site.address}`,
        startTime: startTime,
        endTime: endTime,
        requiredEmployees: 1,
        requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
        status: 'PLANNED', // GEPLANT - noch nicht besetzt!
        siteId: site.id,
      },
    });

    console.log(`✅ Kritische Schicht erstellt:`);
    console.log(`   ID: ${shift.id}`);
    console.log(`   Titel: ${shift.title}`);
    console.log(`   Beginn: ${shift.startTime.toLocaleString('de-DE')}`);
    console.log(`   Ende: ${shift.endTime.toLocaleString('de-DE')}`);
    console.log(`   Status: ${shift.status}`);
    console.log(`   Standort: ${shift.location}`);
    console.log(`\n⚠️  Diese Schicht sollte jetzt auf dem Dashboard als kritisch angezeigt werden!`);
    console.log(`   → Beginnt in ${Math.round((shift.startTime - now) / (1000 * 60 * 60))} Stunden\n`);

    // Erstelle noch 2 weitere Schichten für die nächsten Tage
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(22, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(6, 0, 0, 0);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    await prisma.shift.create({
      data: {
        title: 'Nachtschicht - Noch nicht besetzt',
        description: 'Reguläre Nachtschicht - Bitte Mitarbeiter zuweisen',
        location: `${site.name} - ${site.address}`,
        startTime: tomorrow,
        endTime: tomorrowEnd,
        requiredEmployees: 1,
        requiredQualifications: ['§34a GewO'],
        status: 'PLANNED',
        siteId: site.id,
      },
    });

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    const dayAfterTomorrowEnd = new Date(tomorrowEnd);
    dayAfterTomorrowEnd.setDate(dayAfterTomorrowEnd.getDate() + 1);

    await prisma.shift.create({
      data: {
        title: 'Nachtschicht - Planung erforderlich',
        description: 'Nachtschicht in 2 Tagen - Noch keine Zuweisung',
        location: `${site.name} - ${site.address}`,
        startTime: dayAfterTomorrow,
        endTime: dayAfterTomorrowEnd,
        requiredEmployees: 1,
        requiredQualifications: ['§34a GewO'],
        status: 'PLANNED',
        siteId: site.id,
      },
    });

    console.log(`✅ 3 unbesetzte Schichten insgesamt erstellt für Dashboard-Test\n`);

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createCriticalShift();
