const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTemplates() {
  try {
    console.log('\n🌱 Seeding Templates...\n');

    const templates = [
      {
        name: '24/7 Objektschutz Standard',
        description: 'Rund-um-die-Uhr Bewachung für hochwertige Objekte. 3-Schicht-Betrieb mit qualifiziertem Personal.',
        buildingType: 'OFFICE',
        hoursPerWeek: 168, // 24/7
        shiftModel: '3-SHIFT',
        requiredStaff: 3,
        requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
        tasks: ['ACCESS_CONTROL', 'PATROLS', 'ALARM_RESPONSE', 'KEY_MANAGEMENT'],
        basePrice: 4500.00,
        isActive: true,
      },
      {
        name: 'Tagschicht Bürogebäude',
        description: 'Bewachung während der Geschäftszeiten (Mo-Fr, 7-19 Uhr). Empfang und Zutrittskontrolle.',
        buildingType: 'OFFICE',
        hoursPerWeek: 60, // 12h x 5 Tage
        shiftModel: 'SINGLE_SHIFT',
        requiredStaff: 1,
        requiredQualifications: ['§34a GewO'],
        tasks: ['RECEPTION', 'ACCESS_CONTROL', 'VISITOR_MANAGEMENT'],
        basePrice: 1800.00,
        isActive: true,
      },
      {
        name: 'Nachtschicht Industrie',
        description: 'Nachtwache für Industriegelände (Mo-So, 22-6 Uhr). Rundgänge und Alarmreaktion.',
        buildingType: 'INDUSTRIAL',
        hoursPerWeek: 56, // 8h x 7 Tage
        shiftModel: 'NIGHT_SHIFT',
        requiredStaff: 2,
        requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
        tasks: ['PATROLS', 'ALARM_RESPONSE', 'INCIDENT_REPORTING'],
        basePrice: 2400.00,
        isActive: true,
      },
      {
        name: 'Event-Sicherheit Standard',
        description: 'Flexibler Bewachungsdienst für Veranstaltungen. Personal nach Bedarf, Eventschutz-erfahren.',
        buildingType: 'EVENT',
        hoursPerWeek: 40,
        shiftModel: 'FLEXIBLE',
        requiredStaff: 4,
        requiredQualifications: ['§34a GewO', 'Eventschutz'],
        tasks: ['CROWD_CONTROL', 'ACCESS_CONTROL', 'CONFLICT_RESOLUTION'],
        basePrice: 2800.00,
        isActive: true,
      },
      {
        name: 'Einzelhandel Ladendetektiv',
        description: 'Diebstahlprävention im Einzelhandel. Unauffällige Überwachung während der Öffnungszeiten.',
        buildingType: 'RETAIL',
        hoursPerWeek: 48,
        shiftModel: 'RETAIL_HOURS',
        requiredStaff: 2,
        requiredQualifications: ['§34a GewO', 'Ladendetektiv'],
        tasks: ['SURVEILLANCE', 'THEFT_PREVENTION', 'INCIDENT_REPORTING'],
        basePrice: 2200.00,
        isActive: true,
      },
      {
        name: 'Baustellen-Bewachung',
        description: 'Überwachung von Baustellen gegen Diebstahl und Vandalismus. Nachtschicht + Wochenende.',
        buildingType: 'CONSTRUCTION',
        hoursPerWeek: 84, // Nacht + Wochenende
        shiftModel: 'CONSTRUCTION_WATCH',
        requiredStaff: 1,
        requiredQualifications: ['§34a GewO'],
        tasks: ['PATROLS', 'ALARM_RESPONSE', 'ASSET_PROTECTION'],
        basePrice: 2800.00,
        isActive: true,
      },
    ];

    for (const template of templates) {
      const created = await prisma.siteTemplate.create({
        data: template,
      });
      console.log(`✅ Created template: ${created.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${templates.length} templates!\n`);

  } catch (error) {
    console.error('❌ Error seeding templates:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();
