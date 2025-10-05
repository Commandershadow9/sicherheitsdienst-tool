/**
 * Test-Daten für v1.6.0 Absence Management Features
 *
 * Erstellt umfassende Testszenarien für:
 * - Urlaubsantrag-Detailansicht
 * - Urlaubstage-Saldo
 * - Objekt-Zuordnungen
 * - Betroffene Schichten mit Kapazitätswarnungen
 * - Ersatz-Mitarbeiter-Suche
 * - Krankmeldung Manager-Benachrichtigungen
 */

import { PrismaClient, AbsenceType, AbsenceStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starte v1.6.0 Test-Daten Erstellung...')

  // 1. Admin & Manager erstellen
  const adminPassword = await bcrypt.hash('admin123', 10)
  const managerPassword = await bcrypt.hash('manager123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'test-admin@sicherheitsdienst.de' },
    update: {},
    create: {
      email: 'test-admin@sicherheitsdienst.de',
      password: adminPassword,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      emailOptIn: true,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'test-manager@sicherheitsdienst.de' },
    update: {},
    create: {
      email: 'test-manager@sicherheitsdienst.de',
      password: managerPassword,
      firstName: 'Test',
      lastName: 'Manager',
      role: 'MANAGER',
      emailOptIn: true,
    },
  })

  console.log('✅ Admin & Manager erstellt')

  // 2. Mitarbeiter mit unterschiedlichen Urlaubstagen erstellen
  const employeePassword = await bcrypt.hash('employee123', 10)

  const employees = []
  const employeeData = [
    { firstName: 'Max', lastName: 'Mustermann', email: 'max.mustermann@test.de', leaveDays: 30 },
    { firstName: 'Anna', lastName: 'Schmidt', email: 'anna.schmidt@test.de', leaveDays: 28 },
    { firstName: 'Tom', lastName: 'Weber', email: 'tom.weber@test.de', leaveDays: 30 },
    { firstName: 'Lisa', lastName: 'Müller', email: 'lisa.mueller@test.de', leaveDays: 25 },
    { firstName: 'Jan', lastName: 'Fischer', email: 'jan.fischer@test.de', leaveDays: 30 },
    { firstName: 'Sarah', lastName: 'Becker', email: 'sarah.becker@test.de', leaveDays: 30 },
    { firstName: 'Paul', lastName: 'Koch', email: 'paul.koch@test.de', leaveDays: 26 },
    { firstName: 'Maria', lastName: 'Hoffmann', email: 'maria.hoffmann@test.de', leaveDays: 30 },
  ]

  for (const emp of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: employeePassword,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: 'EMPLOYEE',
        emailOptIn: true,
      },
    })

    await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: { annualLeaveDays: emp.leaveDays },
      create: {
        userId: user.id,
        phone: '+49 170 1234567',
        birthDate: new Date('1990-01-01'),
        employmentStart: new Date('2020-01-01'),
        annualLeaveDays: emp.leaveDays,
      },
    })

    employees.push(user)
  }

  console.log(`✅ ${employees.length} Mitarbeiter erstellt`)

  // 3. Objekte/Sites erstellen
  const sites = []
  const siteData = [
    { name: 'Shoppingcenter West', address: 'Hauptstraße 100', city: 'Berlin', postalCode: '10115' },
    { name: 'Bürokomplex Nord', address: 'Geschäftsstraße 50', city: 'Berlin', postalCode: '10117' },
    { name: 'Industriepark Süd', address: 'Industrieweg 25', city: 'Berlin', postalCode: '10119' },
    { name: 'Krankenhaus Mitte', address: 'Krankenhausstraße 10', city: 'Berlin', postalCode: '10178' },
  ]

  for (const siteInfo of siteData) {
    const site = await prisma.site.create({
      data: {
        name: siteInfo.name,
        address: siteInfo.address,
        city: siteInfo.city,
        postalCode: siteInfo.postalCode,
      },
    })
    sites.push(site)
  }

  console.log(`✅ ${sites.length} Sites erstellt`)

  // 4. Object Clearances erstellen (verschiedene Stati)
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)

  // Max: Alle Sites ACTIVE
  for (const site of sites) {
    await prisma.objectClearance.create({
      data: {
        userId: employees[0].id,
        siteId: site.id,
        status: 'ACTIVE',
        trainedAt: oneMonthAgo,
        validUntil: sixMonthsFromNow,
      },
    })
  }

  // Anna: Shopping & Büro ACTIVE, Industrie EXPIRED
  await prisma.objectClearance.create({
    data: {
      userId: employees[1].id,
      siteId: sites[0].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })
  await prisma.objectClearance.create({
    data: {
      userId: employees[1].id,
      siteId: sites[1].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: oneMonthFromNow,
    },
  })
  await prisma.objectClearance.create({
    data: {
      userId: employees[1].id,
      siteId: sites[2].id,
      status: 'EXPIRED',
      trainedAt: twoMonthsAgo,
      validUntil: oneMonthAgo,
    },
  })

  // Tom: Nur Shopping & Industrie
  await prisma.objectClearance.create({
    data: {
      userId: employees[2].id,
      siteId: sites[0].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })
  await prisma.objectClearance.create({
    data: {
      userId: employees[2].id,
      siteId: sites[2].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: null, // Kein Ablaufdatum
    },
  })

  // Lisa: Nur Krankenhaus
  await prisma.objectClearance.create({
    data: {
      userId: employees[3].id,
      siteId: sites[3].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })

  // Jan: Shopping & Büro
  await prisma.objectClearance.create({
    data: {
      userId: employees[4].id,
      siteId: sites[0].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })
  await prisma.objectClearance.create({
    data: {
      userId: employees[4].id,
      siteId: sites[1].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })

  // Sarah: Alle außer Krankenhaus
  for (let i = 0; i < 3; i++) {
    await prisma.objectClearance.create({
      data: {
        userId: employees[5].id,
        siteId: sites[i].id,
        status: 'ACTIVE',
        trainedAt: oneMonthAgo,
        validUntil: sixMonthsFromNow,
      },
    })
  }

  // Paul: Nur Shopping
  await prisma.objectClearance.create({
    data: {
      userId: employees[6].id,
      siteId: sites[0].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })

  // Maria: Shopping & Industrie
  await prisma.objectClearance.create({
    data: {
      userId: employees[7].id,
      siteId: sites[0].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })
  await prisma.objectClearance.create({
    data: {
      userId: employees[7].id,
      siteId: sites[2].id,
      status: 'ACTIVE',
      trainedAt: oneMonthAgo,
      validUntil: sixMonthsFromNow,
    },
  })

  console.log('✅ Object Clearances erstellt')

  // 5. Schichten erstellen (nächste 2 Wochen)
  const shifts = []
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(8, 0, 0, 0)

  // Shopping Center: Tägliche Schichten (2 Mitarbeiter nötig)
  for (let i = 0; i < 14; i++) {
    const shiftStart = new Date(tomorrow)
    shiftStart.setDate(shiftStart.getDate() + i)
    const shiftEnd = new Date(shiftStart)
    shiftEnd.setHours(18, 0, 0, 0)

    const shift = await prisma.shift.create({
      data: {
        title: `Shopping West - Tagschicht`,
        description: 'Tägliche Sicherheit Shoppingcenter',
        location: sites[0].address,
        startTime: shiftStart,
        endTime: shiftEnd,
        siteId: sites[0].id,
        status: 'PLANNED',
        requiredEmployees: 2,
      },
    })
    shifts.push({ shift, siteIndex: 0 })
  }

  // Bürokomplex: Wochentags-Schichten (1 Mitarbeiter)
  for (let i = 0; i < 10; i++) {
    const shiftStart = new Date(tomorrow)
    shiftStart.setDate(shiftStart.getDate() + i)

    // Nur Montag-Freitag
    if (shiftStart.getDay() === 0 || shiftStart.getDay() === 6) continue

    const shiftEnd = new Date(shiftStart)
    shiftEnd.setHours(17, 0, 0, 0)

    const shift = await prisma.shift.create({
      data: {
        title: `Büro Nord - Tagschicht`,
        description: 'Empfang & Zugangskontrolle',
        location: sites[1].address,
        startTime: shiftStart,
        endTime: shiftEnd,
        siteId: sites[1].id,
        status: 'PLANNED',
        requiredEmployees: 1,
      },
    })
    shifts.push({ shift, siteIndex: 1 })
  }

  // Industriepark: Nachtschichten (2 Mitarbeiter)
  for (let i = 0; i < 7; i++) {
    const shiftStart = new Date(tomorrow)
    shiftStart.setDate(shiftStart.getDate() + i)
    shiftStart.setHours(22, 0, 0, 0)
    const shiftEnd = new Date(shiftStart)
    shiftEnd.setDate(shiftEnd.getDate() + 1)
    shiftEnd.setHours(6, 0, 0, 0)

    const shift = await prisma.shift.create({
      data: {
        title: `Industrie Süd - Nachtschicht`,
        description: 'Nachtpatrouille Industriegelände',
        location: sites[2].address,
        startTime: shiftStart,
        endTime: shiftEnd,
        siteId: sites[2].id,
        status: 'PLANNED',
        requiredEmployees: 2,
      },
    })
    shifts.push({ shift, siteIndex: 2 })
  }

  // Krankenhaus: 24/7 Schichten (3 Mitarbeiter pro Schicht)
  for (let i = 0; i < 7; i++) {
    const shiftStart = new Date(tomorrow)
    shiftStart.setDate(shiftStart.getDate() + i)
    shiftStart.setHours(6, 0, 0, 0)
    const shiftEnd = new Date(shiftStart)
    shiftEnd.setHours(18, 0, 0, 0)

    const shift = await prisma.shift.create({
      data: {
        title: `Krankenhaus Mitte - Tagschicht`,
        description: 'Sicherheit & Ordnung Klinikgelände',
        location: sites[3].address,
        startTime: shiftStart,
        endTime: shiftEnd,
        siteId: sites[3].id,
        status: 'PLANNED',
        requiredEmployees: 3,
      },
    })
    shifts.push({ shift, siteIndex: 3 })
  }

  console.log(`✅ ${shifts.length} Schichten erstellt`)

  // 6. Shift Assignments erstellen
  // Shopping: Max + Anna
  const shoppingShifts = shifts.filter(s => s.siteIndex === 0)
  for (const { shift } of shoppingShifts) {
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employees[0].id, // Max
        status: 'CONFIRMED',
      },
    })
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employees[1].id, // Anna
        status: 'CONFIRMED',
      },
    })
  }

  // Büro: Jan
  const bueroShifts = shifts.filter(s => s.siteIndex === 1)
  for (const { shift } of bueroShifts) {
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employees[4].id, // Jan
        status: 'CONFIRMED',
      },
    })
  }

  // Industrie: Tom + Sarah
  const industrieShifts = shifts.filter(s => s.siteIndex === 2)
  for (const { shift } of industrieShifts) {
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employees[2].id, // Tom
        status: 'CONFIRMED',
      },
    })
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employees[5].id, // Sarah
        status: 'CONFIRMED',
      },
    })
  }

  // Krankenhaus: Lisa (nur 1 von 3 nötig → immer Warnung)
  const krankenhausShifts = shifts.filter(s => s.siteIndex === 3)
  for (const { shift } of krankenhausShifts) {
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: employees[3].id, // Lisa
        status: 'CONFIRMED',
      },
    })
  }

  console.log('✅ Shift Assignments erstellt')

  // 7. Abwesenheiten erstellen

  // Szenario 1: Max - Urlaub REQUESTED in 1 Woche (Shopping betroffen, Kapazitätswarnung)
  const maxVacationStart = new Date(tomorrow)
  maxVacationStart.setDate(maxVacationStart.getDate() + 7)
  maxVacationStart.setHours(0, 0, 0, 0)
  const maxVacationEnd = new Date(maxVacationStart)
  maxVacationEnd.setDate(maxVacationEnd.getDate() + 5)
  maxVacationEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[0].id,
      type: AbsenceType.VACATION,
      status: AbsenceStatus.REQUESTED,
      startsAt: maxVacationStart,
      endsAt: maxVacationEnd,
      reason: 'Familienurlaub in Italien geplant',
      createdById: employees[0].id,
    },
  })

  // Szenario 2: Anna - Bereits genehmigte Urlaubstage (3 Tage letzte Woche)
  const annaVacationStart = new Date(now)
  annaVacationStart.setDate(annaVacationStart.getDate() - 10)
  annaVacationStart.setHours(0, 0, 0, 0)
  const annaVacationEnd = new Date(annaVacationStart)
  annaVacationEnd.setDate(annaVacationEnd.getDate() + 3)
  annaVacationEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[1].id,
      type: AbsenceType.VACATION,
      status: AbsenceStatus.APPROVED,
      startsAt: annaVacationStart,
      endsAt: annaVacationEnd,
      reason: 'Kurzurlaub',
      createdById: employees[1].id,
      decidedById: manager.id,
      decisionNote: 'Genehmigt',
    },
  })

  // Szenario 3: Tom - Krankmeldung HEUTE (auto-approved, Industrie betroffen)
  const tomSickStart = new Date(now)
  tomSickStart.setHours(0, 0, 0, 0)
  const tomSickEnd = new Date(tomSickStart)
  tomSickEnd.setDate(tomSickEnd.getDate() + 2)
  tomSickEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[2].id,
      type: AbsenceType.SICKNESS,
      status: AbsenceStatus.APPROVED,
      startsAt: tomSickStart,
      endsAt: tomSickEnd,
      reason: 'Grippe',
      createdById: employees[2].id,
      decidedById: employees[2].id,
    },
  })

  // Szenario 4: Lisa - Sonderurlaub REQUESTED (Krankenhaus → kritische Unterbesetzung)
  const lisaSpecialStart = new Date(tomorrow)
  lisaSpecialStart.setDate(lisaSpecialStart.getDate() + 3)
  lisaSpecialStart.setHours(0, 0, 0, 0)
  const lisaSpecialEnd = new Date(lisaSpecialStart)
  lisaSpecialEnd.setDate(lisaSpecialEnd.getDate() + 1)
  lisaSpecialEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[3].id,
      type: AbsenceType.SPECIAL_LEAVE,
      status: AbsenceStatus.REQUESTED,
      startsAt: lisaSpecialStart,
      endsAt: lisaSpecialEnd,
      reason: 'Behördentermin',
      createdById: employees[3].id,
    },
  })

  // Szenario 5: Jan - Viele genehmigte Urlaubstage (fast ausgeschöpft)
  for (let i = 0; i < 3; i++) {
    const start = new Date(now)
    start.setMonth(now.getMonth() - 3 + i)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    await prisma.absence.create({
      data: {
        userId: employees[4].id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.APPROVED,
        startsAt: start,
        endsAt: end,
        reason: `Urlaub ${i + 1}`,
        createdById: employees[4].id,
        decidedById: manager.id,
        decisionNote: 'Genehmigt',
      },
    })
  }

  // Szenario 6: Sarah - Neuer Urlaubsantrag der Saldo überschreitet
  const sarahVacationStart = new Date(tomorrow)
  sarahVacationStart.setDate(sarahVacationStart.getDate() + 10)
  sarahVacationStart.setHours(0, 0, 0, 0)
  const sarahVacationEnd = new Date(sarahVacationStart)
  sarahVacationEnd.setDate(sarahVacationEnd.getDate() + 35) // 35 Tage > 30 verfügbar
  sarahVacationEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[5].id,
      type: AbsenceType.VACATION,
      status: AbsenceStatus.REQUESTED,
      startsAt: sarahVacationStart,
      endsAt: sarahVacationEnd,
      reason: 'Weltreise - lange geplant',
      createdById: employees[5].id,
    },
  })

  // Szenario 7: Paul - Abgelehnte Abwesenheit
  const paulVacationStart = new Date(tomorrow)
  paulVacationStart.setDate(paulVacationStart.getDate() + 2)
  paulVacationStart.setHours(0, 0, 0, 0)
  const paulVacationEnd = new Date(paulVacationStart)
  paulVacationEnd.setDate(paulVacationEnd.getDate() + 3)
  paulVacationEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[6].id,
      type: AbsenceType.VACATION,
      status: AbsenceStatus.REJECTED,
      startsAt: paulVacationStart,
      endsAt: paulVacationEnd,
      reason: 'Kurzfristige Reise',
      createdById: employees[6].id,
      decidedById: manager.id,
      decisionNote: 'Leider nicht möglich - zu kurzfristig und Personalmangel',
    },
  })

  // Szenario 8: Maria - Krankmeldung in der Zukunft (sollte normalerweise nicht vorkommen, aber für Tests)
  const mariaSickStart = new Date(tomorrow)
  mariaSickStart.setDate(mariaSickStart.getDate() + 5)
  mariaSickStart.setHours(0, 0, 0, 0)
  const mariaSickEnd = new Date(mariaSickStart)
  mariaSickEnd.setDate(mariaSickEnd.getDate() + 1)
  mariaSickEnd.setHours(23, 59, 59, 999)

  await prisma.absence.create({
    data: {
      userId: employees[7].id,
      type: AbsenceType.SICKNESS,
      status: AbsenceStatus.APPROVED,
      startsAt: mariaSickStart,
      endsAt: mariaSickEnd,
      reason: 'Geplanter Arzttermin mit OP',
      createdById: manager.id,
      decidedById: manager.id,
    },
  })

  console.log('✅ Abwesenheiten erstellt')

  console.log('\n🎉 Test-Daten erfolgreich erstellt!\n')
  console.log('📋 Zusammenfassung:')
  console.log(`   - 1 Admin: test-admin@sicherheitsdienst.de (Passwort: admin123)`)
  console.log(`   - 1 Manager: test-manager@sicherheitsdienst.de (Passwort: manager123)`)
  console.log(`   - ${employees.length} Mitarbeiter (Passwort: employee123)`)
  console.log(`   - ${sites.length} Sites/Objekte`)
  console.log(`   - ${shifts.length} Schichten (nächste 2 Wochen)`)
  console.log(`   - Diverse Object Clearances (ACTIVE, EXPIRED, verschiedene Gültigkeiten)`)
  console.log(`   - 8 Abwesenheiten (REQUESTED, APPROVED, REJECTED, SICKNESS)`)
  console.log('\n🧪 Test-Szenarien:')
  console.log('   1. Max: Urlaub REQUESTED → Shopping betroffen → Kapazitätswarnung → Ersatz: Tom, Jan, Sarah, Paul, Maria verfügbar')
  console.log('   2. Anna: Bereits 3 Urlaubstage genommen (APPROVED)')
  console.log('   3. Tom: Krankmeldung HEUTE → Industrie betroffen → Ersatz: Max, Maria verfügbar')
  console.log('   4. Lisa: Sonderurlaub REQUESTED → Krankenhaus kritisch unterbesetzt → Keine Ersatzkandidaten!')
  console.log('   5. Jan: 21 Urlaubstage bereits genommen → nur noch 9 verfügbar')
  console.log('   6. Sarah: Urlaub REQUESTED 35 Tage → ÜBERSCHREITET Jahresanspruch → Warnung im Saldo')
  console.log('   7. Paul: Abgelehnte Urlaubsanfrage')
  console.log('   8. Maria: Geplanter Krankentermin in Zukunft')
  console.log('\n✨ Bereit für umfangreiches Testing der v1.6.0 Features!\n')
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Erstellen der Test-Daten:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
