/**
 * Test-Daten für v1.8.0 Intelligent Replacement System
 *
 * Erstellt umfassende Testszenarien für:
 * - Intelligent Scoring (Workload, Compliance, Fairness, Preference)
 * - Verschiedene Kandidaten-Typen (OPTIMAL, GOOD, ACCEPTABLE, NOT_RECOMMENDED)
 * - ReplacementCandidatesModalV2 mit Score-Anzeige
 * - EmployeePreferences & EmployeeWorkload Daten
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🤖 Starte v1.8.0 Intelligent Replacement Test-Daten Erstellung...\n')

  // 1. Admin & Manager erstellen
  const adminPassword = await bcrypt.hash('admin123', 10)
  const managerPassword = await bcrypt.hash('manager123', 10)
  const employeePassword = await bcrypt.hash('employee123', 10)

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
  console.log('✅ Admin erstellt:', admin.email)

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
  console.log('✅ Manager erstellt:', manager.email)

  // 2. Mitarbeiter mit unterschiedlichen Profilen erstellen

  // OPTIMAL CANDIDATE - Perfekte Auslastung + Präferenzen passen
  const optimal = await prisma.user.upsert({
    where: { email: 'optimal.candidate@test.de' },
    update: {},
    create: {
      email: 'optimal.candidate@test.de',
      password: employeePassword,
      firstName: 'Optimal',
      lastName: 'Candidate',
      role: 'EMPLOYEE',
    },
  })

  await prisma.employeeProfile.upsert({
    where: { userId: optimal.id },
    update: {},
    create: {
      userId: optimal.id,
      annualLeaveDays: 30,
      weeklyTargetHours: 40,
      monthlyTargetHours: 160,
    },
  })
  console.log('✅ OPTIMAL Candidate erstellt:', optimal.email)

  // GOOD CANDIDATE - Gute Auslastung, aber etwas mehr Nachtschichten
  const good = await prisma.user.upsert({
    where: { email: 'good.candidate@test.de' },
    update: {},
    create: {
      email: 'good.candidate@test.de',
      password: employeePassword,
      firstName: 'Good',
      lastName: 'Candidate',
      role: 'EMPLOYEE',
    },
  })

  await prisma.employeeProfile.upsert({
    where: { userId: good.id },
    update: {},
    create: {
      userId: good.id,
      annualLeaveDays: 30,
      weeklyTargetHours: 40,
      monthlyTargetHours: 160,
    },
  })
  console.log('✅ GOOD Candidate erstellt:', good.email)

  // ACCEPTABLE CANDIDATE - Hohe Auslastung, knapp an der Grenze
  const acceptable = await prisma.user.upsert({
    where: { email: 'acceptable.candidate@test.de' },
    update: {},
    create: {
      email: 'acceptable.candidate@test.de',
      password: employeePassword,
      firstName: 'Acceptable',
      lastName: 'Candidate',
      role: 'EMPLOYEE',
    },
  })

  await prisma.employeeProfile.upsert({
    where: { userId: acceptable.id },
    update: {},
    create: {
      userId: acceptable.id,
      annualLeaveDays: 30,
      weeklyTargetHours: 40,
      monthlyTargetHours: 160,
    },
  })
  console.log('✅ ACCEPTABLE Candidate erstellt:', acceptable.email)

  // NOT_RECOMMENDED CANDIDATE - Überlastet + zu wenig Ruhezeit
  const notRecommended = await prisma.user.upsert({
    where: { email: 'overworked.candidate@test.de' },
    update: {},
    create: {
      email: 'overworked.candidate@test.de',
      password: employeePassword,
      firstName: 'Overworked',
      lastName: 'Candidate',
      role: 'EMPLOYEE',
    },
  })

  await prisma.employeeProfile.upsert({
    where: { userId: notRecommended.id },
    update: {},
    create: {
      userId: notRecommended.id,
      annualLeaveDays: 30,
      weeklyTargetHours: 40,
      monthlyTargetHours: 160,
    },
  })
  console.log('✅ NOT_RECOMMENDED Candidate erstellt:', notRecommended.email)

  // ABSENT EMPLOYEE - Derjenige der fehlt
  const absent = await prisma.user.upsert({
    where: { email: 'absent.employee@test.de' },
    update: {},
    create: {
      email: 'absent.employee@test.de',
      password: employeePassword,
      firstName: 'Absent',
      lastName: 'Employee',
      role: 'EMPLOYEE',
    },
  })

  await prisma.employeeProfile.upsert({
    where: { userId: absent.id },
    update: {},
    create: {
      userId: absent.id,
      annualLeaveDays: 30,
      weeklyTargetHours: 40,
      monthlyTargetHours: 160,
    },
  })
  console.log('✅ ABSENT Employee erstellt:', absent.email)

  // 3. Sites/Objekte erstellen
  console.log('\n📍 Erstelle Sites...')

  const testSite = await prisma.site.create({
    data: {
      name: 'Test-Objekt Replacement',
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '12345',
    },
  })
  console.log('✅ Site erstellt:', testSite.name)

  // 4. Object Clearances erstellen (alle für Test-Site)
  console.log('\n🔐 Erstelle Object Clearances...')

  await prisma.objectClearance.createMany({
    data: [
      { userId: optimal.id, siteId: testSite.id, status: 'ACTIVE', trainedAt: new Date() },
      { userId: good.id, siteId: testSite.id, status: 'ACTIVE', trainedAt: new Date() },
      { userId: acceptable.id, siteId: testSite.id, status: 'ACTIVE', trainedAt: new Date() },
      { userId: notRecommended.id, siteId: testSite.id, status: 'ACTIVE', trainedAt: new Date() },
      { userId: absent.id, siteId: testSite.id, status: 'ACTIVE', trainedAt: new Date() },
    ],
  })
  console.log('✅ Object Clearances erstellt für alle Kandidaten')

  // 5. Employee Preferences erstellen
  console.log('\n🎯 Erstelle Employee Preferences...')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // OPTIMAL: Präferenzen passen perfekt zu Tagschicht
  await prisma.employeePreferences.create({
    data: {
      userId: optimal.id,
      prefersNightShifts: false,
      prefersDayShifts: true,
      prefersWeekends: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 140,
      maxMonthlyHours: 180,
      flexibleHours: true,
      prefersLongShifts: false,
      prefersShortShifts: false,
      prefersConsecutiveDays: 5,
      minRestDaysPerWeek: 2,
      preferredSiteIds: [testSite.id],
      avoidedSiteIds: [],
      notes: 'Bevorzugt Tagschichten, sehr zuverlässig',
    },
  })

  // GOOD: Präferenzen ok, aber bevorzugt Nachtschichten (Tagschicht passt nicht perfekt)
  await prisma.employeePreferences.create({
    data: {
      userId: good.id,
      prefersNightShifts: true,
      prefersDayShifts: false,
      prefersWeekends: true,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      flexibleHours: true,
      prefersLongShifts: true,
      prefersShortShifts: false,
      prefersConsecutiveDays: 6,
      minRestDaysPerWeek: 1,
      preferredSiteIds: [],
      avoidedSiteIds: [],
      notes: 'Flexibel, macht auch Tagschichten wenn nötig',
    },
  })

  // ACCEPTABLE: Keine besonderen Präferenzen
  await prisma.employeePreferences.create({
    data: {
      userId: acceptable.id,
      prefersNightShifts: false,
      prefersDayShifts: false,
      prefersWeekends: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 150,
      maxMonthlyHours: 170,
      flexibleHours: false,
      prefersLongShifts: false,
      prefersShortShifts: false,
      prefersConsecutiveDays: 5,
      minRestDaysPerWeek: 2,
      preferredSiteIds: [],
      avoidedSiteIds: [testSite.id], // Vermeidet Test-Site!
      notes: 'Wenig flexibel, vermeidet bestimmte Objekte',
    },
  })

  // NOT_RECOMMENDED: Wird bereits max. Stunden überschreiten
  await prisma.employeePreferences.create({
    data: {
      userId: notRecommended.id,
      prefersNightShifts: false,
      prefersDayShifts: true,
      prefersWeekends: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 140,
      maxMonthlyHours: 170, // Niedrige Grenze!
      flexibleHours: false,
      prefersLongShifts: false,
      prefersShortShifts: true,
      prefersConsecutiveDays: 4,
      minRestDaysPerWeek: 2,
      preferredSiteIds: [],
      avoidedSiteIds: [],
      notes: 'Schon überlastet, sollte nicht noch mehr Stunden bekommen',
    },
  })

  console.log('✅ Employee Preferences erstellt')

  // 6. Employee Workload erstellen
  console.log('\n📊 Erstelle Employee Workload...')

  // OPTIMAL: Perfekte 75% Auslastung (120/160 = 75%)
  await prisma.employeeWorkload.create({
    data: {
      userId: optimal.id,
      month: currentMonth,
      year: currentYear,
      totalHours: 120,
      scheduledHours: 120,
      nightShiftCount: 4, // Team-Durchschnitt: 5
      weekendShiftCount: 2,
      maxWeeklyHours: 40,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 5,
      restDaysCount: 2,
      fairnessScore: 85,
    },
  })

  // GOOD: 60% Auslastung (96/160 = 60%), etwas mehr Nachtschichten
  await prisma.employeeWorkload.create({
    data: {
      userId: good.id,
      month: currentMonth,
      year: currentYear,
      totalHours: 96,
      scheduledHours: 96,
      nightShiftCount: 8, // Über Durchschnitt!
      weekendShiftCount: 4,
      maxWeeklyHours: 42,
      minRestHoursBetweenShifts: 11,
      consecutiveDaysWorked: 6,
      restDaysCount: 1,
      fairnessScore: 70,
    },
  })

  // ACCEPTABLE: 95% Auslastung (152/160 = 95%), knapp an Grenze
  await prisma.employeeWorkload.create({
    data: {
      userId: acceptable.id,
      month: currentMonth,
      year: currentYear,
      totalHours: 152,
      scheduledHours: 152,
      nightShiftCount: 6,
      weekendShiftCount: 3,
      maxWeeklyHours: 46,
      minRestHoursBetweenShifts: 10.5, // Knapp!
      consecutiveDaysWorked: 7, // Über Limit!
      restDaysCount: 0,
      fairnessScore: 55,
    },
  })

  // NOT_RECOMMENDED: 115% Auslastung (184/160 = 115%), KRITISCH!
  await prisma.employeeWorkload.create({
    data: {
      userId: notRecommended.id,
      month: currentMonth,
      year: currentYear,
      totalHours: 184,
      scheduledHours: 184,
      nightShiftCount: 12,
      weekendShiftCount: 6,
      maxWeeklyHours: 52, // Über ArbZG Limit!
      minRestHoursBetweenShifts: 8.5, // Kritisch niedrig!
      consecutiveDaysWorked: 9, // Viel zu viele!
      restDaysCount: 0,
      fairnessScore: 25,
    },
  })

  console.log('✅ Employee Workload erstellt')

  // 7. Test-Schichten erstellen
  console.log('\n📅 Erstelle Test-Schichten...')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(8, 0, 0, 0) // 8:00 Uhr

  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(18, 0, 0, 0) // 18:00 Uhr

  // Schicht für morgen: Tagschicht 8-18 Uhr (10h)
  const testShift = await prisma.shift.create({
    data: {
      siteId: testSite.id,
      title: 'Test-Tagschicht (Intelligent Replacement Demo)',
      description: 'Diese Schicht nutzt das Intelligent Replacement System',
      location: testSite.address,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      requiredEmployees: 2,
      requiredQualifications: ['§34a GewO'],
      status: 'PLANNED',
      assignments: {
        create: [
          {
            userId: absent.id,
            assignedAt: new Date(),
          },
        ],
      },
    },
  })
  console.log('✅ Test-Schicht erstellt:', testShift.title)

  // 8. Schicht in der Vergangenheit für "letzte Schicht" Berechnung
  console.log('\n⏮️  Erstelle vergangene Schichten für Ruhezeit-Berechnung...')

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(22, 0, 0, 0) // 22:00 Uhr gestern

  const todayMorning = new Date()
  todayMorning.setHours(6, 0, 0, 0) // 6:00 Uhr heute

  // OPTIMAL: Letzte Schicht gestern 22-6 Uhr (von gestern 22 Uhr bis heute 6 Uhr)
  // Ruhezeit bis morgen 8 Uhr = 26h (perfekt!)
  await prisma.shift.create({
    data: {
      siteId: testSite.id,
      title: 'Nachtschicht Optimal (abgeschlossen)',
      location: testSite.address,
      startTime: yesterday,
      endTime: todayMorning,
      requiredEmployees: 1,
      status: 'COMPLETED',
      assignments: {
        create: [{ userId: optimal.id, assignedAt: new Date() }],
      },
    },
  })

  // NOT_RECOMMENDED: Letzte Schicht heute früh 6-14 Uhr
  // Ruhezeit bis morgen 8 Uhr = nur 18h (ok, aber er ist überlastet)
  const todayMorning6 = new Date()
  todayMorning6.setHours(6, 0, 0, 0)
  const todayAfternoon = new Date()
  todayAfternoon.setHours(14, 0, 0, 0)

  await prisma.shift.create({
    data: {
      siteId: testSite.id,
      title: 'Tagschicht Overworked (abgeschlossen)',
      location: testSite.address,
      startTime: todayMorning6,
      endTime: todayAfternoon,
      requiredEmployees: 1,
      status: 'COMPLETED',
      assignments: {
        create: [{ userId: notRecommended.id, assignedAt: new Date() }],
      },
    },
  })

  console.log('✅ Vergangene Schichten erstellt')

  // 9. Abwesenheit für "Absent Employee" erstellen
  console.log('\n🏖️  Erstelle Abwesenheit...')

  const absenceStart = new Date(tomorrow)
  const absenceEnd = new Date(tomorrow)
  absenceEnd.setDate(absenceEnd.getDate() + 2) // 3 Tage

  await prisma.absence.create({
    data: {
      userId: absent.id,
      type: 'SICKNESS',
      status: 'APPROVED',
      startsAt: absenceStart,
      endsAt: absenceEnd,
      reason: 'Krankheitsfall - Ersatz wird benötigt',
      createdById: manager.id,
      decidedById: manager.id,
      decisionNote: 'Genehmigt, bitte Ersatz organisieren',
    },
  })

  console.log('✅ Abwesenheit erstellt für:', absent.email)

  // Zusammenfassung
  console.log('\n' + '='.repeat(60))
  console.log('🎉 v1.8.0 Intelligent Replacement Test-Daten erfolgreich erstellt!')
  console.log('='.repeat(60))
  console.log('\n📋 Test-Szenarien:')
  console.log('\n1️⃣  OPTIMAL CANDIDATE (Score: 85-100)')
  console.log('   - Email: optimal.candidate@test.de')
  console.log('   - Auslastung: 75% (120/160h) ✅')
  console.log('   - Ruhezeit: 26h seit letzter Schicht ✅')
  console.log('   - Präferenz: Tagschichten bevorzugt ✅')
  console.log('   - Fairness: 85/100 ✅')
  console.log('\n2️⃣  GOOD CANDIDATE (Score: 70-84)')
  console.log('   - Email: good.candidate@test.de')
  console.log('   - Auslastung: 60% (96/160h) ✅')
  console.log('   - Nachtschichten: 8 (Ø 5) ⚠️')
  console.log('   - Präferenz: Nachtschichten bevorzugt (aber flexibel) ⚠️')
  console.log('\n3️⃣  ACCEPTABLE CANDIDATE (Score: 50-69)')
  console.log('   - Email: acceptable.candidate@test.de')
  console.log('   - Auslastung: 95% (152/160h) ⚠️')
  console.log('   - Ruhezeit: 10.5h (knapp) ⚠️')
  console.log('   - Site-Präferenz: Vermeidet Test-Objekt! ⚠️')
  console.log('   - Consecutive Days: 7 (zu viele) ⚠️')
  console.log('\n4️⃣  NOT_RECOMMENDED CANDIDATE (Score: <50)')
  console.log('   - Email: overworked.candidate@test.de')
  console.log('   - Auslastung: 115% (184/160h) ❌')
  console.log('   - Wöchentliche Stunden: 52h (> ArbZG 48h) ❌')
  console.log('   - Ruhezeit: 8.5h (< 9h kritisch) ❌')
  console.log('   - Consecutive Days: 9 (viel zu viele) ❌')
  console.log('\n5️⃣  ABSENT EMPLOYEE')
  console.log('   - Email: absent.employee@test.de')
  console.log('   - Status: SICKNESS (3 Tage ab morgen)')
  console.log('   - Schicht: Test-Tagschicht morgen 8-18 Uhr')
  console.log('\n' + '='.repeat(60))
  console.log('🧪 Test-Anleitung:')
  console.log('='.repeat(60))
  console.log('\n1. Als Admin/Manager anmelden:')
  console.log('   test-admin@sicherheitsdienst.de / admin123')
  console.log('   test-manager@sicherheitsdienst.de / manager123')
  console.log('\n2. Zu Abwesenheiten navigieren')
  console.log('\n3. Abwesenheit "Absent Employee" öffnen')
  console.log('\n4. Bei betroffener Schicht "Ersatz finden" klicken')
  console.log('\n5. Intelligent Replacement Modal öffnet sich mit:')
  console.log('   - Score-Ring (0-100) mit Farbe')
  console.log('   - Metriken-Grid (Auslastung, Ruhezeit, Nachtschichten, Ersätze)')
  console.log('   - Warnungs-Badges bei Problemen')
  console.log('   - Detail-Scores aufklappbar')
  console.log('   - Sortierung: Beste Kandidaten zuerst')
  console.log('\n6. Verschiedene Kandidaten vergleichen:')
  console.log('   - Grüne Card = OPTIMAL')
  console.log('   - Gelbe Card = GOOD')
  console.log('   - Orange Card = ACCEPTABLE')
  console.log('   - Rote Card = NOT_RECOMMENDED')
  console.log('\n' + '='.repeat(60))
  console.log('✨ Viel Erfolg beim Testen!')
  console.log('='.repeat(60) + '\n')
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
