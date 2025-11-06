import { PrismaClient } from '@prisma/client';
import { resetSeedData, createUserWithPassword } from './seedHelpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Erstelle umfassende Test-Szenarien für v1.9.2...');

  try {
    await resetSeedData(prisma);
    console.log('🗑️  Alte Daten gelöscht');

    // ===== 0. DEFAULT CUSTOMER ERSTELLEN =====
    const defaultCustomer = await prisma.customer.create({
      data: {
        companyName: 'Test Security GmbH',
        industry: 'Sicherheitsdienste',
        taxId: 'DE123456789',
        primaryContact: {
          name: 'Test Admin',
          email: 'admin@test-security.de',
          phone: '+49 123 456789',
          position: 'Geschäftsführer',
        },
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
      },
    });
    const defaultCustomerId = defaultCustomer.id;
    console.log('✅ Default Customer erstellt');

    // ===== 1. BENUTZER ERSTELLEN =====
    const admin = await createUserWithPassword(prisma, {
      email: 'admin@sicherheitsdienst.de',
      firstName: 'Max',
      lastName: 'Administrator',
      phone: '+49 123 000001',
      role: 'ADMIN',
      employeeId: 'ADM001',
      hireDate: new Date('2020-01-01'),
      qualifications: ['Erste Hilfe', 'Brandschutz', 'Management'],
      isActive: true,
      customerId: defaultCustomerId,
    });

    const manager = await createUserWithPassword(prisma, {
      email: 'manager@sicherheitsdienst.de',
      firstName: 'Lisa',
      lastName: 'Manager',
      phone: '+49 123 000002',
      role: 'MANAGER',
      employeeId: 'MGR001',
      hireDate: new Date('2020-06-01'),
      qualifications: ['Erste Hilfe', 'Einsatzplanung'],
      isActive: true,
      customerId: defaultCustomerId,
    });

    // Mitarbeiter mit verschiedenen Profilen
    const employees = await Promise.all([
      // Mitarbeiter 1: Wenig Workload, verfügbar
      createUserWithPassword(prisma, {
        email: 'thomas.mueller@sec.de',
        firstName: 'Thomas',
        lastName: 'Müller',
        phone: '+49 123 100001',
        role: 'EMPLOYEE',
        employeeId: 'EMP001',
        hireDate: new Date('2023-01-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      // Mitarbeiter 2: Hohe Workload
      createUserWithPassword(prisma, {
        email: 'anna.schmidt@sec.de',
        firstName: 'Anna',
        lastName: 'Schmidt',
        phone: '+49 123 100002',
        role: 'EMPLOYEE',
        employeeId: 'EMP002',
        hireDate: new Date('2023-02-01'),
        qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      // Mitarbeiter 3: Heute abwesend (APPROVED) - macht Schicht kritisch
      createUserWithPassword(prisma, {
        email: 'michael.wagner@sec.de',
        firstName: 'Michael',
        lastName: 'Wagner',
        phone: '+49 123 100003',
        role: 'EMPLOYEE',
        employeeId: 'EMP003',
        hireDate: new Date('2023-03-01'),
        qualifications: ['Erste Hilfe', 'Brandschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      // Mitarbeiter 4: Urlaubsantrag eingereicht (REQUESTED) - genug Tage
      createUserWithPassword(prisma, {
        email: 'julia.becker@sec.de',
        firstName: 'Julia',
        lastName: 'Becker',
        phone: '+49 123 100004',
        role: 'EMPLOYEE',
        employeeId: 'EMP004',
        hireDate: new Date('2023-04-01'),
        qualifications: ['Erste Hilfe', 'Personenschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      // Mitarbeiter 5: Urlaubsantrag eingereicht - ÜBERSCHREITET Urlaubstage
      createUserWithPassword(prisma, {
        email: 'stefan.fischer@sec.de',
        firstName: 'Stefan',
        lastName: 'Fischer',
        phone: '+49 123 100005',
        role: 'EMPLOYEE',
        employeeId: 'EMP005',
        hireDate: new Date('2023-05-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      // Mitarbeiter 6-10: Weitere Mitarbeiter für Replacement
      createUserWithPassword(prisma, {
        email: 'petra.hoffmann@sec.de',
        firstName: 'Petra',
        lastName: 'Hoffmann',
        phone: '+49 123 100006',
        role: 'EMPLOYEE',
        employeeId: 'EMP006',
        hireDate: new Date('2023-06-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      createUserWithPassword(prisma, {
        email: 'markus.klein@sec.de',
        firstName: 'Markus',
        lastName: 'Klein',
        phone: '+49 123 100007',
        role: 'EMPLOYEE',
        employeeId: 'EMP007',
        hireDate: new Date('2023-07-01'),
        qualifications: ['Erste Hilfe', 'Brandschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      createUserWithPassword(prisma, {
        email: 'sabine.wolf@sec.de',
        firstName: 'Sabine',
        lastName: 'Wolf',
        phone: '+49 123 100008',
        role: 'EMPLOYEE',
        employeeId: 'EMP008',
        hireDate: new Date('2023-08-01'),
        qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      createUserWithPassword(prisma, {
        email: 'daniel.richter@sec.de',
        firstName: 'Daniel',
        lastName: 'Richter',
        phone: '+49 123 100009',
        role: 'EMPLOYEE',
        employeeId: 'EMP009',
        hireDate: new Date('2023-09-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
      createUserWithPassword(prisma, {
        email: 'claudia.zimmermann@sec.de',
        firstName: 'Claudia',
        lastName: 'Zimmermann',
        phone: '+49 123 100010',
        role: 'EMPLOYEE',
        employeeId: 'EMP010',
        hireDate: new Date('2023-10-01'),
        qualifications: ['Erste Hilfe', 'Personenschutz'],
        isActive: true,
        customerId: defaultCustomerId,
      }),
    ]);

    console.log(`✅ ${employees.length + 2} Benutzer erstellt`);

    // ===== 2. EMPLOYEE PROFILES =====
    await Promise.all(
      employees.map((emp, idx) =>
        prisma.employeeProfile.create({
          data: {
            userId: emp.id,
            annualLeaveDays: 30,
            hourlyRate: 15 + idx * 0.5,
            employmentType: 'FULL_TIME',
          },
        }),
      ),
    );

    console.log('✅ Employee Profiles erstellt');

    // ===== 3. SITES =====
    const site1 = await prisma.site.create({
      data: {
        name: 'Bürogebäude Zentrum',
        address: 'Hauptstraße 1',
        city: 'Berlin',
        postalCode: '10115',
      },
    });

    const site2 = await prisma.site.create({
      data: {
        name: 'Einkaufszentrum Nord',
        address: 'Nordstraße 50',
        city: 'Berlin',
        postalCode: '10115',
      },
    });

    console.log('✅ 2 Sites erstellt');

    // ===== 4. OBJECT CLEARANCES =====
    // Alle Mitarbeiter haben Clearance für Site 1
    await Promise.all(
      employees.map((emp) =>
        prisma.objectClearance.create({
          data: {
            userId: emp.id,
            siteId: site1.id,
            status: 'ACTIVE',
            trainedAt: new Date('2024-01-01'),
            validUntil: new Date('2025-12-31'),
          },
        }),
      ),
    );

    // Nur einige haben Clearance für Site 2
    for (let i = 0; i < 5; i++) {
      await prisma.objectClearance.create({
        data: {
          userId: employees[i].id,
          siteId: site2.id,
          status: 'ACTIVE',
          trainedAt: new Date('2024-01-01'),
          validUntil: new Date('2025-12-31'),
        },
      });
    }

    console.log('✅ Object Clearances erstellt');

    // ===== 5. SCHICHTEN FÜR HEUTE =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Schicht 1: 08:00-16:00 Heute - KRITISCH (1 Mitarbeiter fehlt)
    const shift1Start = new Date(today);
    shift1Start.setHours(8, 0, 0, 0);
    const shift1End = new Date(today);
    shift1End.setHours(16, 0, 0, 0);

    const shift1 = await prisma.shift.create({
      data: {
        title: 'Tagschicht Bürogebäude',
        location: 'Hauptstraße 1, 10115 Berlin',
        siteId: site1.id,
        startTime: shift1Start,
        endTime: shift1End,
        requiredEmployees: 3,
        status: 'PLANNED',
      },
    });

    // Schicht 2: 18:00-02:00 Heute Nacht - OK (nicht kritisch)
    const shift2Start = new Date(today);
    shift2Start.setHours(18, 0, 0, 0);
    const shift2End = new Date(today);
    shift2End.setDate(shift2End.getDate() + 1);
    shift2End.setHours(2, 0, 0, 0);

    const shift2 = await prisma.shift.create({
      data: {
        title: 'Nachtschicht Einkaufszentrum',
        location: 'Nordstraße 50, 10115 Berlin',
        siteId: site2.id,
        startTime: shift2Start,
        endTime: shift2End,
        requiredEmployees: 2,
        status: 'PLANNED',
      },
    });

    // Schicht 3: Morgen - für REQUESTED Absence Test
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const shift3Start = new Date(tomorrow);
    shift3Start.setHours(8, 0, 0, 0);
    const shift3End = new Date(tomorrow);
    shift3End.setHours(16, 0, 0, 0);

    const shift3 = await prisma.shift.create({
      data: {
        title: 'Tagschicht Bürogebäude',
        location: 'Hauptstraße 1, 10115 Berlin',
        siteId: site1.id,
        startTime: shift3Start,
        endTime: shift3End,
        requiredEmployees: 2,
        status: 'PLANNED',
      },
    });

    console.log('✅ 3 Schichten erstellt');

    // ===== 6. SHIFT ASSIGNMENTS =====
    // Shift 1: 3 zugewiesen, aber 1 ist abwesend → 2 verfügbar → KRITISCH!
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift1.id,
        userId: employees[0].id, // Thomas - verfügbar
        status: 'ASSIGNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift1.id,
        userId: employees[1].id, // Anna - verfügbar
        status: 'ASSIGNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift1.id,
        userId: employees[2].id, // Michael - HEUTE ABWESEND!
        status: 'ASSIGNED',
      },
    });

    // Shift 2: 2 zugewiesen, beide verfügbar → OK
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift2.id,
        userId: employees[5].id, // Petra
        status: 'ASSIGNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift2.id,
        userId: employees[6].id, // Markus
        status: 'ASSIGNED',
      },
    });

    // Shift 3: Morgen - 2 zugewiesen
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift3.id,
        userId: employees[3].id, // Julia - hat REQUESTED absence
        status: 'ASSIGNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift3.id,
        userId: employees[7].id, // Sabine
        status: 'ASSIGNED',
      },
    });

    console.log('✅ Shift Assignments erstellt');

    // ===== 7. ABWESENHEITEN =====

    // 7.1. APPROVED Abwesenheit - macht Shift 1 kritisch
    await prisma.absence.create({
      data: {
        userId: employees[2].id, // Michael Wagner
        type: 'SICKNESS',
        status: 'APPROVED',
        startsAt: today,
        endsAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Grippe',
        createdById: manager.id,
        decidedById: manager.id,
        decisionNote: 'Gute Besserung!',
      },
    });

    // 7.2. REQUESTED Urlaubsantrag - Julia - genug Urlaubstage (5 von 30)
    const juliaVacationStart = new Date(tomorrow);
    const juliaVacationEnd = new Date(tomorrow);
    juliaVacationEnd.setDate(juliaVacationEnd.getDate() + 4); // 5 Tage

    await prisma.absence.create({
      data: {
        userId: employees[3].id, // Julia Becker
        type: 'VACATION',
        status: 'REQUESTED',
        startsAt: juliaVacationStart,
        endsAt: juliaVacationEnd,
        reason: 'Kurzurlaub',
        createdById: employees[3].id,
      },
    });

    // 7.3. REQUESTED Urlaubsantrag - Stefan - ÜBERSCHREITET Urlaubstage
    // Stefan hat schon 25 Tage genommen, will aber noch 10 → Überschreitung!
    const stefanPastVacations = [
      // Urlaub im Februar - 10 Tage
      {
        startsAt: new Date('2025-02-01'),
        endsAt: new Date('2025-02-10'),
      },
      // Urlaub im Mai - 15 Tage
      {
        startsAt: new Date('2025-05-01'),
        endsAt: new Date('2025-05-15'),
      },
    ];

    for (const vacation of stefanPastVacations) {
      await prisma.absence.create({
        data: {
          userId: employees[4].id, // Stefan Fischer
          type: 'VACATION',
          status: 'APPROVED',
          startsAt: vacation.startsAt,
          endsAt: vacation.endsAt,
          reason: 'Urlaub',
          createdById: employees[4].id,
          decidedById: manager.id,
          decisionNote: 'Genehmigt',
        },
      });
    }

    // Jetzt der neue Antrag: 10 Tage (würde zu 35 Tagen führen)
    const stefanNewVacationStart = new Date(today);
    stefanNewVacationStart.setDate(stefanNewVacationStart.getDate() + 7); // In 7 Tagen
    const stefanNewVacationEnd = new Date(stefanNewVacationStart);
    stefanNewVacationEnd.setDate(stefanNewVacationEnd.getDate() + 9); // 10 Tage

    await prisma.absence.create({
      data: {
        userId: employees[4].id, // Stefan Fischer
        type: 'VACATION',
        status: 'REQUESTED',
        startsAt: stefanNewVacationStart,
        endsAt: stefanNewVacationEnd,
        reason: 'Sommerurlaub - verlängert',
        createdById: employees[4].id,
      },
    });

    // 7.4. REQUESTED Absence mit Schicht-Konflikt
    const petrasAbsenceStart = new Date(today);
    petrasAbsenceStart.setDate(petrasAbsenceStart.getDate() + 3);
    const petrasAbsenceEnd = new Date(petrasAbsenceStart);
    petrasAbsenceEnd.setDate(petrasAbsenceEnd.getDate() + 2);

    // Erstelle eine Schicht für den Zeitraum
    const shift4Start = new Date(petrasAbsenceStart);
    shift4Start.setHours(8, 0, 0, 0);
    const shift4End = new Date(petrasAbsenceStart);
    shift4End.setHours(16, 0, 0, 0);

    const shift4 = await prisma.shift.create({
      data: {
        title: 'Tagschicht Einkaufszentrum',
        location: 'Nordstraße 50, 10115 Berlin',
        siteId: site2.id,
        startTime: shift4Start,
        endTime: shift4End,
        requiredEmployees: 1,
        status: 'PLANNED',
      },
    });

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift4.id,
        userId: employees[5].id, // Petra
        status: 'ASSIGNED',
      },
    });

    await prisma.absence.create({
      data: {
        userId: employees[5].id, // Petra Hoffmann
        type: 'VACATION',
        status: 'REQUESTED',
        startsAt: petrasAbsenceStart,
        endsAt: petrasAbsenceEnd,
        reason: 'Familienbesuch',
        createdById: employees[5].id,
      },
    });

    console.log('✅ Abwesenheiten erstellt (APPROVED + REQUESTED)');

    // ===== 8. EMPLOYEE WORKLOADS (für Scoring) =====
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Verschiedene Workload-Szenarien
    const workloads = [
      { userId: employees[0].id, totalHours: 80, nightShifts: 2 }, // Thomas - wenig
      { userId: employees[1].id, totalHours: 160, nightShifts: 8 }, // Anna - hoch
      { userId: employees[2].id, totalHours: 120, nightShifts: 5 }, // Michael - mittel
      { userId: employees[3].id, totalHours: 100, nightShifts: 3 }, // Julia - niedrig-mittel
      { userId: employees[4].id, totalHours: 140, nightShifts: 7 }, // Stefan - hoch
      { userId: employees[5].id, totalHours: 90, nightShifts: 4 }, // Petra - niedrig
      { userId: employees[6].id, totalHours: 110, nightShifts: 5 }, // Markus - mittel
      { userId: employees[7].id, totalHours: 130, nightShifts: 6 }, // Sabine - mittel-hoch
      { userId: employees[8].id, totalHours: 75, nightShifts: 2 }, // Daniel - sehr niedrig
      { userId: employees[9].id, totalHours: 95, nightShifts: 3 }, // Claudia - niedrig
    ];

    for (const workload of workloads) {
      await prisma.employeeWorkload.create({
        data: {
          userId: workload.userId,
          month: currentMonth,
          year: currentYear,
          totalHours: workload.totalHours,
          nightShiftCount: workload.nightShifts,
          weekendShiftCount: 0,
        },
      });
    }

    console.log('✅ Employee Workloads erstellt');

    // ===== ZUSAMMENFASSUNG =====
    console.log('\n🎉 Test-Szenarien erfolgreich erstellt!\n');
    console.log('📊 ÜBERSICHT:');
    console.log(`   👥 Benutzer: ${employees.length + 2} (${employees.length} Employees, 1 Admin, 1 Manager)`);
    console.log('   🏢 Sites: 2');
    console.log('   📅 Schichten heute: 2 (1 kritisch, 1 OK)');
    console.log('   📝 Abwesenheiten:');
    console.log('      - 1 APPROVED (Krankmeldung heute - macht Schicht kritisch)');
    console.log('      - 3 REQUESTED Urlaubsanträge:');
    console.log('        • Julia: 5 Tage, genug Urlaubstage ✅');
    console.log('        • Stefan: 10 Tage, ÜBERSCHREITET Urlaubstage ⚠️');
    console.log('        • Petra: 3 Tage, betrifft geplante Schicht 🔍');
    console.log('\n🔐 LOGIN:');
    console.log('   Email: admin@sicherheitsdienst.de');
    console.log('   Password: password123');
    console.log('\n📋 TEST-SZENARIEN:');
    console.log('   1️⃣  Dashboard → Kritische Schichten → "Ersatz suchen"');
    console.log('      → Sollte optimale Kandidaten mit Scores anzeigen');
    console.log('   2️⃣  Dashboard → Eingereichte Urlaube → Julia/Stefan/Petra Details');
    console.log('      → Sollte Urlaubstage-Saldo anzeigen');
    console.log('   3️⃣  Dashboard → Details öffnen → Ersatz zuweisen → Modal schließen');
    console.log('      → Dashboard sollte sich automatisch aktualisieren\n');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Test-Daten:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
