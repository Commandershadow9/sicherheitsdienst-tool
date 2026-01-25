import { PrismaClient } from '@prisma/client';
import { resetSeedData, createUserWithPassword } from './seedHelpers';

const prisma = new PrismaClient();

/**
 * 🎯 Umfassende Test-Daten für v1.22.6 - Intelligente MA-Ersatzsuche
 *
 * TEST-SZENARIEN:
 * 1. MA mit Clearance (sofort einsetzbar)
 * 2. MA ohne Clearance (mit Warning-Badge)
 * 3. MA mit REQUESTED absence während Schicht (mit Warning)
 * 4. MA mit verschiedenen Workload-Levels (Scoring)
 * 5. MA mit unterschiedlichen Ruhezeiten (Compliance)
 * 6. Historische Schichten für Fairness-Berechnung
 */
async function main() {
  console.log('🌱 Erstelle umfassende Test-Szenarien für v1.22.6 - MA-Ersatzsuche...\n');

  try {
    await resetSeedData(prisma);
    console.log('🗑️  Alte Daten gelöscht\n');

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
    console.log('✅ Default Customer erstellt\n');

    // ===== 1. ADMIN & MANAGER =====
    const _admin = await createUserWithPassword(prisma, {
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

    console.log('✅ Admin & Manager erstellt');

    // ===== 2. MITARBEITER MIT VERSCHIEDENEN PROFILEN =====
    const employeeProfiles = [
      // 🟢 Gruppe 1: Erfahrene MA mit Clearances (OPTIMAL für Replacement)
      {
        email: 'thomas.mueller@sec.de',
        firstName: 'Thomas',
        lastName: 'Müller',
        employeeId: 'EMP001',
        hireDate: new Date('2021-01-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz', 'Brandschutz'],
        hasClearance: true,
        workloadHours: 80, // Niedrige Auslastung
        nightShifts: 2,
        replacementCount: 3, // Hat schon ersetzt
      },
      {
        email: 'anna.schmidt@sec.de',
        firstName: 'Anna',
        lastName: 'Schmidt',
        employeeId: 'EMP002',
        hireDate: new Date('2021-03-01'),
        qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
        hasClearance: true,
        workloadHours: 145, // Hohe Auslastung
        nightShifts: 7,
        replacementCount: 8,
      },
      {
        email: 'michael.wagner@sec.de',
        firstName: 'Michael',
        lastName: 'Wagner',
        employeeId: 'EMP003',
        hireDate: new Date('2021-06-01'),
        qualifications: ['Erste Hilfe', 'Brandschutz', 'Personenschutz'],
        hasClearance: true,
        workloadHours: 120,
        nightShifts: 5,
        replacementCount: 5,
      },
      {
        email: 'julia.becker@sec.de',
        firstName: 'Julia',
        lastName: 'Becker',
        employeeId: 'EMP004',
        hireDate: new Date('2022-01-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        hasClearance: true,
        workloadHours: 95,
        nightShifts: 3,
        replacementCount: 4,
      },
      {
        email: 'stefan.fischer@sec.de',
        firstName: 'Stefan',
        lastName: 'Fischer',
        employeeId: 'EMP005',
        hireDate: new Date('2022-03-01'),
        qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
        hasClearance: true,
        workloadHours: 110,
        nightShifts: 4,
        replacementCount: 6,
      },

      // 🟡 Gruppe 2: MA mit Clearance ABER hoher Auslastung (GOOD/ACCEPTABLE)
      {
        email: 'petra.hoffmann@sec.de',
        firstName: 'Petra',
        lastName: 'Hoffmann',
        employeeId: 'EMP006',
        hireDate: new Date('2022-06-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        hasClearance: true,
        workloadHours: 155, // Sehr hoch
        nightShifts: 9,
        replacementCount: 10, // Viele Ersätze
      },
      {
        email: 'markus.klein@sec.de',
        firstName: 'Markus',
        lastName: 'Klein',
        employeeId: 'EMP007',
        hireDate: new Date('2022-09-01'),
        qualifications: ['Erste Hilfe', 'Brandschutz'],
        hasClearance: true,
        workloadHours: 150,
        nightShifts: 8,
        replacementCount: 7,
      },

      // 🔴 Gruppe 3: MA OHNE Clearance (NEUE Mitarbeiter - brauchen Einweisung)
      {
        email: 'sabine.wolf@sec.de',
        firstName: 'Sabine',
        lastName: 'Wolf',
        employeeId: 'EMP008',
        hireDate: new Date('2024-10-01'), // NEU!
        qualifications: ['Erste Hilfe'],
        hasClearance: false, // ⚠️ Keine Clearance
        workloadHours: 30, // Noch wenig gearbeitet
        nightShifts: 1,
        replacementCount: 0,
      },
      {
        email: 'daniel.richter@sec.de',
        firstName: 'Daniel',
        lastName: 'Richter',
        employeeId: 'EMP009',
        hireDate: new Date('2024-10-15'), // NEU!
        qualifications: ['Erste Hilfe'],
        hasClearance: false, // ⚠️ Keine Clearance
        workloadHours: 20,
        nightShifts: 0,
        replacementCount: 0,
      },
      {
        email: 'claudia.zimmermann@sec.de',
        firstName: 'Claudia',
        lastName: 'Zimmermann',
        employeeId: 'EMP010',
        hireDate: new Date('2024-09-01'), // Relativ neu
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        hasClearance: false, // ⚠️ Keine Clearance
        workloadHours: 50,
        nightShifts: 2,
        replacementCount: 1,
      },

      // 🟢 Gruppe 4: Weitere erfahrene MA mit Clearance
      {
        email: 'robert.schuster@sec.de',
        firstName: 'Robert',
        lastName: 'Schuster',
        employeeId: 'EMP011',
        hireDate: new Date('2021-09-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz', 'Brandschutz'],
        hasClearance: true,
        workloadHours: 105,
        nightShifts: 4,
        replacementCount: 5,
      },
      {
        email: 'maria.weber@sec.de',
        firstName: 'Maria',
        lastName: 'Weber',
        employeeId: 'EMP012',
        hireDate: new Date('2022-01-15'),
        qualifications: ['Erste Hilfe', 'Personenschutz'],
        hasClearance: true,
        workloadHours: 90,
        nightShifts: 3,
        replacementCount: 4,
      },
      {
        email: 'frank.meyer@sec.de',
        firstName: 'Frank',
        lastName: 'Meyer',
        employeeId: 'EMP013',
        hireDate: new Date('2022-04-01'),
        qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
        hasClearance: true,
        workloadHours: 125,
        nightShifts: 6,
        replacementCount: 7,
      },

      // 🔴 Gruppe 5: Noch mehr MA ohne Clearance (für umfassende Tests)
      {
        email: 'sandra.lange@sec.de',
        firstName: 'Sandra',
        lastName: 'Lange',
        employeeId: 'EMP014',
        hireDate: new Date('2024-10-20'), // Brandneu
        qualifications: ['Erste Hilfe'],
        hasClearance: false,
        workloadHours: 15,
        nightShifts: 0,
        replacementCount: 0,
      },
      {
        email: 'patrick.koch@sec.de',
        firstName: 'Patrick',
        lastName: 'Koch',
        employeeId: 'EMP015',
        hireDate: new Date('2024-09-15'),
        qualifications: ['Erste Hilfe'],
        hasClearance: false,
        workloadHours: 40,
        nightShifts: 1,
        replacementCount: 1,
      },

      // 🟡 Gruppe 6: MA mit Clearance ABER mit REQUESTED absence
      {
        email: 'nicole.bauer@sec.de',
        firstName: 'Nicole',
        lastName: 'Bauer',
        employeeId: 'EMP016',
        hireDate: new Date('2022-07-01'),
        qualifications: ['Erste Hilfe', 'Objektschutz'],
        hasClearance: true,
        workloadHours: 100,
        nightShifts: 4,
        replacementCount: 5,
        hasRequestedAbsence: true, // ⚠️ Urlaubsantrag läuft
      },
    ];

    const employees = await Promise.all(
      employeeProfiles.map((profile) =>
        createUserWithPassword(prisma, {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: `+49 123 10${String(employeeProfiles.indexOf(profile) + 1).padStart(4, '0')}`,
          role: 'EMPLOYEE',
          employeeId: profile.employeeId,
          hireDate: profile.hireDate,
          qualifications: profile.qualifications,
          isActive: true,
          customerId: defaultCustomerId,
        }),
      ),
    );

    console.log(`✅ ${employees.length} Mitarbeiter erstellt (${employeeProfiles.filter(p => p.hasClearance).length} mit, ${employeeProfiles.filter(p => !p.hasClearance).length} ohne Clearance)`);

    // ===== 3. EMPLOYEE PROFILES =====
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

    // ===== 4. KUNDEN =====
    const customer1 = await prisma.customer.create({
      data: {
        companyName: 'TechCorp GmbH',
        industry: 'IT & Software',
        taxId: 'DE123456789',
        primaryContact: {
          name: 'Dr. Marcus Weber',
          email: 'marcus.weber@techcorp.de',
          phone: '+49 30 12345-100',
          position: 'Geschäftsführer',
        },
        contacts: [
          {
            name: 'Sandra Müller',
            email: 'sandra.mueller@techcorp.de',
            phone: '+49 30 12345-101',
            position: 'Facility Manager',
          },
          {
            name: 'Thomas Klein',
            email: 'thomas.klein@techcorp.de',
            phone: '+49 30 12345-102',
            position: 'Head of Security',
          },
        ],
        address: 'Technologiepark 15',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Deutschland',
        paymentTerms: '14 Tage netto',
        discount: 5.0, // 5% Stammkunden-Rabatt
        notes: 'Wichtiger Stammkunde seit 2020. Regelmäßige Sicherheitschecks erforderlich. Bevorzugt erfahrene Mitarbeiter.',
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        companyName: 'Shopping Paradise AG',
        industry: 'Einzelhandel',
        taxId: 'DE987654321',
        primaryContact: {
          name: 'Jennifer Schmidt',
          email: 'j.schmidt@shopping-paradise.de',
          phone: '+49 30 98765-200',
          position: 'Center Manager',
        },
        contacts: [
          {
            name: 'Michael Bauer',
            email: 'm.bauer@shopping-paradise.de',
            phone: '+49 30 98765-201',
            position: 'Sicherheitsbeauftragter',
          },
        ],
        address: 'Einzelhandelsstraße 42',
        city: 'Berlin',
        postalCode: '10117',
        country: 'Deutschland',
        billingAddress: {
          address: 'Zentrale, Konzernstraße 1',
          city: 'Hamburg',
          postalCode: '20095',
          country: 'Deutschland',
        },
        paymentTerms: '30 Tage netto',
        notes: 'Hoher Besucherverkehr, besonders am Wochenende. 24/7 Sicherheit erforderlich.',
      },
    });

    const customer3 = await prisma.customer.create({
      data: {
        companyName: 'Industrie Solutions GmbH & Co. KG',
        industry: 'Industrie & Fertigung',
        taxId: 'DE555666777',
        primaryContact: {
          name: 'Dipl.-Ing. Robert Fischer',
          email: 'r.fischer@industrie-solutions.de',
          phone: '+49 30 55566-300',
          position: 'Betriebsleiter',
        },
        contacts: [
          {
            name: 'Klaus Werner',
            email: 'k.werner@industrie-solutions.de',
            phone: '+49 30 55566-301',
            position: 'Arbeitssicherheit',
          },
        ],
        address: 'Industrieweg 88',
        city: 'Berlin',
        postalCode: '10318',
        country: 'Deutschland',
        paymentTerms: '30 Tage netto',
        discount: 3.0,
        notes: 'Industriegelände mit mehreren Hallen. Besondere Anforderungen an Brandschutz und Arbeitssicherheit.',
      },
    });

    const customer4 = await prisma.customer.create({
      data: {
        companyName: 'Premium Events & Messen GmbH',
        industry: 'Veranstaltungen',
        taxId: 'DE111222333',
        primaryContact: {
          name: 'Lisa Wagner',
          email: 'lisa.wagner@premium-events.de',
          phone: '+49 30 11122-400',
          position: 'Event Director',
        },
        contacts: [],
        address: 'Messegelände Ost 5',
        city: 'Berlin',
        postalCode: '14055',
        country: 'Deutschland',
        paymentTerms: '7 Tage nach Veranstaltungsende',
        notes: 'Wechselnde Veranstaltungsorte. Flexible Einsatzplanung erforderlich. Projekt-basierte Abrechnung.',
      },
    });

    console.log('✅ 4 Kunden erstellt (IT, Einzelhandel, Industrie, Events)');

    // ===== 5. SITES =====
    const site1 = await prisma.site.create({
      data: {
        name: 'Bürogebäude Zentrum',
        address: 'Hauptstraße 1',
        city: 'Berlin',
        postalCode: '10115',
        status: 'ACTIVE',
        customerId: customer1.id, // TechCorp
        buildingType: 'OFFICE',
        floorCount: 8,
        squareMeters: 5000,
        customerName: 'TechCorp GmbH',
        customerCompany: 'TechCorp GmbH',
        customerEmail: 'marcus.weber@techcorp.de',
        customerPhone: '+49 30 12345-100',
      },
    });

    const site2 = await prisma.site.create({
      data: {
        name: 'Einkaufszentrum Nord',
        address: 'Nordstraße 50',
        city: 'Berlin',
        postalCode: '10115',
        status: 'ACTIVE',
        customerId: customer2.id, // Shopping Paradise
        buildingType: 'RETAIL',
        floorCount: 3,
        squareMeters: 12000,
        customerName: 'Shopping Paradise AG',
        customerCompany: 'Shopping Paradise AG',
        customerEmail: 'j.schmidt@shopping-paradise.de',
        customerPhone: '+49 30 98765-200',
      },
    });

    const site3 = await prisma.site.create({
      data: {
        name: 'Produktionshalle Ost',
        address: 'Industrieweg 88',
        city: 'Berlin',
        postalCode: '10318',
        status: 'ACTIVE',
        customerId: customer3.id, // Industrie Solutions
        buildingType: 'INDUSTRIAL',
        floorCount: 2,
        squareMeters: 8500,
        customerName: 'Industrie Solutions GmbH & Co. KG',
        customerCompany: 'Industrie Solutions GmbH & Co. KG',
        customerEmail: 'r.fischer@industrie-solutions.de',
        customerPhone: '+49 30 55566-300',
      },
    });

    const site4 = await prisma.site.create({
      data: {
        name: 'Messegelände Süd - Halle 7',
        address: 'Messegelände Ost 5',
        city: 'Berlin',
        postalCode: '14055',
        status: 'ACTIVE',
        customerId: customer4.id, // Premium Events
        buildingType: 'EVENT',
        floorCount: 1,
        squareMeters: 3000,
        customerName: 'Premium Events & Messen GmbH',
        customerCompany: 'Premium Events & Messen GmbH',
        customerEmail: 'lisa.wagner@premium-events.de',
        customerPhone: '+49 30 11122-400',
      },
    });

    console.log('✅ 4 Sites erstellt (Büro, Shopping, Industrie, Messe) und mit Kunden verknüpft');

    // ===== 5. OBJECT CLEARANCES (Gezielt verteilt) =====
    // Nur Mitarbeiter mit hasClearance: true bekommen Clearances
    // Realistische Verteilung über alle Sites

    // Site 1 (Bürogebäude): Alle 11 MA mit Clearance
    for (let i = 0; i < employeeProfiles.length; i++) {
      if (employeeProfiles[i].hasClearance) {
        await prisma.objectClearance.create({
          data: {
            userId: employees[i].id,
            siteId: site1.id,
            status: 'ACTIVE',
            trainedAt: new Date('2024-01-01'),
            validUntil: new Date('2025-12-31'),
          },
        });
      }
    }

    // Site 2 (Einkaufszentrum): 8 MA (überschneidend mit Site 1)
    const site2Employees = [0, 1, 2, 4, 5, 6, 10, 11]; // Mix aus erfahrenen MA
    for (const idx of site2Employees) {
      if (employeeProfiles[idx].hasClearance) {
        await prisma.objectClearance.create({
          data: {
            userId: employees[idx].id,
            siteId: site2.id,
            status: 'ACTIVE',
            trainedAt: new Date('2024-03-01'),
            validUntil: new Date('2025-12-31'),
          },
        });
      }
    }

    // Site 3 (Produktionshalle): 6 MA (Industrie-erfahren)
    const site3Employees = [0, 2, 3, 6, 10, 12]; // Thomas, Michael, Julia, Markus, Robert, Frank
    for (const idx of site3Employees) {
      if (employeeProfiles[idx].hasClearance) {
        await prisma.objectClearance.create({
          data: {
            userId: employees[idx].id,
            siteId: site3.id,
            status: 'ACTIVE',
            trainedAt: new Date('2024-06-01'),
            validUntil: new Date('2025-12-31'),
          },
        });
      }
    }

    // Site 4 (Messegelände): 5 MA (Event-erfahren)
    const site4Employees = [1, 4, 5, 11, 12]; // Anna, Stefan, Petra, Maria, Frank
    for (const idx of site4Employees) {
      if (employeeProfiles[idx].hasClearance) {
        await prisma.objectClearance.create({
          data: {
            userId: employees[idx].id,
            siteId: site4.id,
            status: 'ACTIVE',
            trainedAt: new Date('2024-08-01'),
            validUntil: new Date('2025-12-31'),
          },
        });
      }
    }

    console.log(`✅ Object Clearances erstellt:`);
    console.log(`   - Site 1 (Bürogebäude): 11 MA`);
    console.log(`   - Site 2 (Einkaufszentrum): 8 MA`);
    console.log(`   - Site 3 (Produktionshalle): 6 MA`);
    console.log(`   - Site 4 (Messegelände): 5 MA`);

    // ===== 6. SCHICHTEN FÜR HEUTE =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Schicht 1: HEUTE 08:00-16:00 - Braucht ERSATZ (nur 1/3 besetzt)
    const shift1Start = new Date(today);
    shift1Start.setHours(8, 0, 0, 0);
    const shift1End = new Date(today);
    shift1End.setHours(16, 0, 0, 0);

    const shift1 = await prisma.shift.create({
      data: {
        title: 'Tagschicht Bürogebäude',
        location: site1.address + ', ' + site1.city,
        siteId: site1.id,
        startTime: shift1Start,
        endTime: shift1End,
        requiredEmployees: 4, // Braucht 4 MA!
        status: 'PLANNED',
        requiredQualifications: ['Erste Hilfe', 'Objektschutz'],
      },
    });

    // Nur 1 MA zugewiesen → 3 fehlen!
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift1.id,
        userId: employees[0].id, // Thomas (EMP001)
        status: 'ASSIGNED',
      },
    });

    console.log('✅ Schicht 1 erstellt (HEUTE 08:00-16:00, 1/4 besetzt - KRITISCH)');

    // Schicht 2: HEUTE 18:00-02:00 Nacht - Unterbesetzt (2/3 besetzt)
    const shift2Start = new Date(today);
    shift2Start.setHours(18, 0, 0, 0);
    const shift2End = new Date(today);
    shift2End.setDate(shift2End.getDate() + 1);
    shift2End.setHours(2, 0, 0, 0);

    const shift2 = await prisma.shift.create({
      data: {
        title: 'Nachtschicht Einkaufszentrum',
        location: site2.address + ', ' + site2.city,
        siteId: site2.id,
        startTime: shift2Start,
        endTime: shift2End,
        requiredEmployees: 3,
        status: 'PLANNED',
      },
    });

    await prisma.shiftAssignment.createMany({
      data: [
        { shiftId: shift2.id, userId: employees[1].id, status: 'ASSIGNED' }, // Anna
        { shiftId: shift2.id, userId: employees[4].id, status: 'ASSIGNED' }, // Stefan
      ],
    });

    console.log('✅ Schicht 2 erstellt (HEUTE 18:00-02:00, 2/3 besetzt)');

    // Schicht 3: MORGEN 08:00-16:00 - Für REQUESTED absence Test
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const shift3Start = new Date(tomorrow);
    shift3Start.setHours(8, 0, 0, 0);
    const shift3End = new Date(tomorrow);
    shift3End.setHours(16, 0, 0, 0);

    const shift3 = await prisma.shift.create({
      data: {
        title: 'Tagschicht Bürogebäude',
        location: site1.address + ', ' + site1.city,
        siteId: site1.id,
        startTime: shift3Start,
        endTime: shift3End,
        requiredEmployees: 3,
        status: 'PLANNED',
      },
    });

    await prisma.shiftAssignment.createMany({
      data: [
        { shiftId: shift3.id, userId: employees[2].id, status: 'ASSIGNED' }, // Michael
        { shiftId: shift3.id, userId: employees[3].id, status: 'ASSIGNED' }, // Julia
      ],
    });

    console.log('✅ Schicht 3 erstellt (MORGEN 08:00-16:00, 2/3 besetzt)');

    // ===== 7. HISTORISCHE SCHICHTEN (für Fairness-Berechnung) =====
    const pastDates = [-7, -14, -21, -30]; // Tage in der Vergangenheit

    for (const daysAgo of pastDates) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() + daysAgo);

      const pastShiftStart = new Date(pastDate);
      pastShiftStart.setHours(8, 0, 0, 0);
      const pastShiftEnd = new Date(pastDate);
      pastShiftEnd.setHours(16, 0, 0, 0);

      const pastShift = await prisma.shift.create({
        data: {
          title: `Tagschicht (${Math.abs(daysAgo)}d ago)`,
          location: site1.address,
          siteId: site1.id,
          startTime: pastShiftStart,
          endTime: pastShiftEnd,
          requiredEmployees: 3,
          status: 'COMPLETED',
        },
      });

      // Verschiedene MA wurden eingeteilt
      const assignedEmployeeIndices = [0, 2, 4]; // Thomas, Michael, Stefan
      for (const empIndex of assignedEmployeeIndices) {
        await prisma.shiftAssignment.create({
          data: {
            shiftId: pastShift.id,
            userId: employees[empIndex].id,
            status: 'COMPLETED',
          },
        });
      }
    }

    console.log('✅ 4 historische Schichten erstellt (für Fairness-Score)');

    // ===== 8. ABWESENHEITEN =====

    // APPROVED Abwesenheit (heute)
    await prisma.absence.create({
      data: {
        userId: employees[5].id, // Petra (hat hohe Auslastung)
        type: 'SICKNESS',
        status: 'APPROVED',
        startsAt: today,
        endsAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Erkältung',
        createdById: manager.id,
        decidedById: manager.id,
        decisionNote: 'Gute Besserung!',
      },
    });

    // REQUESTED Urlaubsantrag (überlappt mit Shift 3 morgen)
    const nicolesAbsenceStart = new Date(tomorrow);
    const nicolesAbsenceEnd = new Date(tomorrow);
    nicolesAbsenceEnd.setDate(nicolesAbsenceEnd.getDate() + 4); // 5 Tage

    await prisma.absence.create({
      data: {
        userId: employees[15].id, // Nicole (EMP016)
        type: 'VACATION',
        status: 'REQUESTED',
        startsAt: nicolesAbsenceStart,
        endsAt: nicolesAbsenceEnd,
        reason: 'Kurzurlaub',
        createdById: employees[15].id,
      },
    });

    console.log('✅ Abwesenheiten erstellt (1 APPROVED, 1 REQUESTED)');

    // ===== 9. EMPLOYEE WORKLOADS (für Scoring) =====
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    for (let i = 0; i < employeeProfiles.length; i++) {
      await prisma.employeeWorkload.create({
        data: {
          userId: employees[i].id,
          month: currentMonth,
          year: currentYear,
          totalHours: employeeProfiles[i].workloadHours,
          scheduledHours: employeeProfiles[i].workloadHours,
          nightShiftCount: employeeProfiles[i].nightShifts,
          weekendShiftCount: Math.floor(employeeProfiles[i].nightShifts / 2),
          consecutiveDaysWorked: Math.floor(employeeProfiles[i].workloadHours / 40), // Schätzung
          restDaysCount: Math.max(0, 30 - Math.floor(employeeProfiles[i].workloadHours / 8)),
        },
      });
    }

    console.log('✅ Employee Workloads erstellt (für Scoring)');

    // ===== ZUSAMMENFASSUNG =====
    console.log('\n🎉 Umfassende Test-Daten erfolgreich erstellt!\n');
    console.log('📊 ÜBERSICHT:');
    console.log(`   👥 Benutzer: ${employees.length + 2} (${employees.length} Employees, 1 Admin, 1 Manager)`);
    console.log(`   🟢 MA mit Clearance: ${employeeProfiles.filter(p => p.hasClearance).length}`);
    console.log(`   🔴 MA ohne Clearance: ${employeeProfiles.filter(p => !p.hasClearance).length} (NEU - für Warning-Badge Test)`);
    console.log('   🏢 Kunden: 4 (IT, Einzelhandel, Industrie, Events)');
    console.log('   🏗️  Sites: 4 (Bürogebäude, Einkaufszentrum, Produktionshalle, Messegelände)');
    console.log('   📅 Aktuelle Schichten: 3 (1 kritisch, 2 unterbesetzt)');
    console.log('   📜 Historische Schichten: 4 (für Fairness-Berechnung)');
    console.log('   📝 Abwesenheiten: 1 APPROVED, 1 REQUESTED');
    console.log('\n🏢 KUNDEN-ÜBERSICHT:');
    console.log('   1. TechCorp GmbH (IT) → Bürogebäude Zentrum');
    console.log('   2. Shopping Paradise AG (Retail) → Einkaufszentrum Nord');
    console.log('   3. Industrie Solutions GmbH & Co. KG (Industrie) → Produktionshalle Ost');
    console.log('   4. Premium Events & Messen GmbH (Events) → Messegelände Süd - Halle 7');
    console.log('\n🔐 LOGIN:');
    console.log('   Email: admin@sicherheitsdienst.de');
    console.log('   Password: password123');
    console.log('\n📋 TEST-SZENARIEN:');
    console.log('\n   1️⃣  KRITISCHE SCHICHT - Ersatz suchen (heute 08:00-16:00)');
    console.log('      → Dashboard → Kritische Schichten → "Ersatz suchen"');
    console.log('      → Erwartung: 16 Kandidaten (10 mit ✓, 6 mit ⚠️ Clearance-Warning)');
    console.log('      → Score-Kategorien: OPTIMAL (wenig Auslastung), GOOD, ACCEPTABLE, NOT_RECOMMENDED');
    console.log('\n   2️⃣  CLEARANCE-WARNING testen');
    console.log('      → Suche Kandidaten für Schicht 1');
    console.log('      → Filter: Sabine Wolf, Daniel Richter, Claudia Zimmermann');
    console.log('      → Erwartung: Badge "⚠️ Keine Objekt-Clearance - Einweisung erforderlich"');
    console.log('\n   3️⃣  REQUESTED ABSENCE testen');
    console.log('      → Suche Kandidaten für Schicht 3 (morgen)');
    console.log('      → Nicole Bauer sollte erscheinen MIT Warning: "⚠️ Urlaubsantrag offen"');
    console.log('\n   4️⃣  SCORING testen');
    console.log('      → Thomas Müller (80h): OPTIMAL Score (niedrige Auslastung)');
    console.log('      → Anna Schmidt (145h): ACCEPTABLE/NOT_RECOMMENDED (hohe Auslastung)');
    console.log('      → Daniel Richter (20h): GOOD aber mit Clearance-Warning');
    console.log('\n   5️⃣  STATISTIKEN prüfen');
    console.log('      → API Response sollte enthalten: { total: 16, optimal: X, good: Y, acceptable: Z }');
    console.log('\n   6️⃣  KUNDEN-ÜBERSICHT testen');
    console.log('      → Navigation → Kunden');
    console.log('      → Erwartung: 4 Kunden mit unterschiedlichen Branchen');
    console.log('      → Kunde auswählen → Objekte des Kunden anzeigen');
    console.log('      → Ansprechpartner-Details prüfen (primär + weitere Kontakte)');
    console.log('      → Zahlungsbedingungen und Rabatte anzeigen');
    console.log('\n🔧 Seed ausführen:');
    console.log('   cd backend && npx ts-node src/utils/seedReplacementTest.ts\n');
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
