import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Erstelle Test-Daten für Sicherheitsdienst-Tool...');

  try {
    // Erst alle bestehenden Daten löschen (für sauberen Start)
    await prisma.shiftAssignment.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.user.deleteMany();

    console.log('🗑️ Alte Daten gelöscht');

    // Test-Mitarbeiter erstellen
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Admin erstellen
    const _admin = await prisma.user.create({
      data: {
        email: 'admin@sicherheitsdienst.de',
        password: hashedPassword,
        firstName: 'Max',
        lastName: 'Mustermann',
        phone: '+49 123 456789',
        role: 'ADMIN',
        employeeId: 'ADM001',
        hireDate: new Date('2024-01-01'),
        qualifications: ['Erste Hilfe', 'Brandschutz', 'Wachdienst', 'Führungszeugnis'],
        isActive: true,
      },
    });

    // 2. Dispatcher/Manager erstellen
    const _dispatcher = await prisma.user.create({
      data: {
        email: 'dispatcher@sicherheitsdienst.de',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Weber',
        phone: '+49 123 456788',
        role: 'DISPATCHER',
        employeeId: 'DIS001',
        hireDate: new Date('2024-01-15'),
        qualifications: ['Erste Hilfe', 'Einsatzplanung', 'Kommunikation'],
        isActive: true,
      },
    });

    // 3. Sicherheitsmitarbeiter erstellen
    const employee1 = await prisma.user.create({
      data: {
        email: 'thomas.mueller@sicherheitsdienst.de',
        password: hashedPassword,
        firstName: 'Thomas',
        lastName: 'Müller',
        phone: '+49 123 456790',
        role: 'EMPLOYEE',
        employeeId: 'SEC001',
        hireDate: new Date('2024-02-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz', 'Brandschutz'],
        isActive: true,
      },
    });

    const employee2 = await prisma.user.create({
      data: {
        email: 'anna.schmidt@sicherheitsdienst.de',
        password: hashedPassword,
        firstName: 'Anna',
        lastName: 'Schmidt',
        phone: '+49 123 456791',
        role: 'EMPLOYEE',
        employeeId: 'SEC002',
        hireDate: new Date('2024-03-01'),
        qualifications: ['Erste Hilfe', 'Veranstaltungsschutz', 'Personenschutz'],
        isActive: true,
      },
    });

    const employee3 = await prisma.user.create({
      data: {
        email: 'michael.wagner@sicherheitsdienst.de',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Wagner',
        phone: '+49 123 456792',
        role: 'EMPLOYEE',
        employeeId: 'SEC003',
        hireDate: new Date('2024-04-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz', 'Wachdienst'],
        isActive: true,
      },
    });

    console.log('👥 Mitarbeiter erstellt');

    // Test-Schichten erstellen

    // 1. Objektschutz - Tagschicht
    const morningShift = await prisma.shift.create({
      data: {
        title: 'Objektschutz Bürogebäude - Tagschicht',
        description:
          'Sicherheitsdienst für Bürokomplex in der Innenstadt. Zugangskontrolle, Empfang, Rundgänge.',
        location: 'Business Center, Musterstraße 123, 12345 Musterstadt',
        startTime: new Date('2025-05-27T06:00:00Z'),
        endTime: new Date('2025-05-27T14:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: ['Objektschutz'],
        status: 'PLANNED',
      },
    });

    // 2. Objektschutz - Nachtschicht
    const nightShift = await prisma.shift.create({
      data: {
        title: 'Objektschutz Bürogebäude - Nachtschicht',
        description:
          'Nachtdienst für Bürokomplex. Überwachung, Alarmanlage, Rundgänge alle 2 Stunden.',
        location: 'Business Center, Musterstraße 123, 12345 Musterstadt',
        startTime: new Date('2025-05-27T22:00:00Z'),
        endTime: new Date('2025-05-28T06:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: ['Objektschutz', 'Wachdienst'],
        status: 'PLANNED',
      },
    });

    // 3. Veranstaltungsschutz
    const eventShift = await prisma.shift.create({
      data: {
        title: 'Veranstaltungsschutz - Stadtfest',
        description:
          'Sicherheitsdienst beim Stadtfest. Einlasskontrolle, Crowd Management, Notfallbereitschaft.',
        location: 'Marktplatz, 12345 Musterstadt',
        startTime: new Date('2025-05-31T14:00:00Z'),
        endTime: new Date('2025-06-01T02:00:00Z'),
        requiredEmployees: 3,
        requiredQualifications: ['Veranstaltungsschutz'],
        status: 'PLANNED',
      },
    });

    // 4. Baustellenüberwachung
    const constructionShift = await prisma.shift.create({
      data: {
        title: 'Baustellenüberwachung - Bahnhofsprojekt',
        description: 'Sicherung der Baustelle am Hauptbahnhof. Zufahrtskontrolle, Diebstahlschutz.',
        location: 'Hauptbahnhof Baustelle, Bahnhofstraße 1, 12345 Musterstadt',
        startTime: new Date('2025-05-28T06:00:00Z'),
        endTime: new Date('2025-05-28T18:00:00Z'),
        requiredEmployees: 2,
        requiredQualifications: ['Objektschutz'],
        status: 'PLANNED',
      },
    });

    console.log('📅 Schichten erstellt');

    // Schicht-Zuweisungen erstellen
    await prisma.shiftAssignment.create({
      data: {
        userId: employee1.id,
        shiftId: morningShift.id,
        status: 'CONFIRMED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        userId: employee3.id,
        shiftId: nightShift.id,
        status: 'ASSIGNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        userId: employee2.id,
        shiftId: eventShift.id,
        status: 'CONFIRMED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        userId: employee1.id,
        shiftId: constructionShift.id,
        status: 'ASSIGNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        userId: employee3.id,
        shiftId: constructionShift.id,
        status: 'ASSIGNED',
      },
    });

    console.log('✅ Schicht-Zuweisungen erstellt');

    // Beispiel Zeiterfassung
    await prisma.timeEntry.create({
      data: {
        userId: employee1.id,
        startTime: new Date('2025-05-26T06:00:00Z'),
        endTime: new Date('2025-05-26T14:00:00Z'),
        breakTime: 30, // 30 Minuten Pause
        startLocation: 'Business Center Eingang',
        endLocation: 'Business Center Ausgang',
        notes: 'Routinedienst, keine besonderen Vorkommnisse',
      },
    });

    // Beispiel Vorfall
    await prisma.incident.create({
      data: {
        title: 'Unberechtigter Zutrittsversuch',
        description:
          'Person ohne Berechtigung versuchte das Gebäude zu betreten. Höflich abgewiesen und Sachverhalt dokumentiert.',
        severity: 'LOW',
        status: 'RESOLVED',
        location: 'Business Center Haupteingang',
        occurredAt: new Date('2025-05-26T10:30:00Z'),
        reportedBy: employee1.id,
      },
    });

    console.log('📋 Beispiel-Daten (Zeiterfassung & Vorfälle) erstellt');

    console.log('\n🎉 Test-Daten erfolgreich erstellt!');
    console.log('\n👤 Login-Daten:');
    console.log('📧 Admin: admin@sicherheitsdienst.de / password123');
    console.log('📧 Dispatcher: dispatcher@sicherheitsdienst.de / password123');
    console.log('📧 Mitarbeiter 1: thomas.mueller@sicherheitsdienst.de / password123');
    console.log('📧 Mitarbeiter 2: anna.schmidt@sicherheitsdienst.de / password123');
    console.log('📧 Mitarbeiter 3: michael.wagner@sicherheitsdienst.de / password123');

    console.log('\n🔗 Nächste Schritte:');
    console.log('1. Prisma Studio öffnen: http://localhost:5555');
    console.log('2. APIs testen: http://localhost:3001/api/users');
    console.log('3. Backend läuft auf: http://localhost:3001');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Test-Daten:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
