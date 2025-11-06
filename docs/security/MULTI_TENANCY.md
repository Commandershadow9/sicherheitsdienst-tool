# 🔐 Multi-Tenancy Security Architecture

**Status:** ✅ Implementiert (v1.24.0 - PR #0)
**Sicherheitsstufe:** KRITISCH
**Letzte Aktualisierung:** 5. November 2025

---

## Überblick

Das **sicherheitsdienst-tool** nutzt eine **3-Ebenen-Multi-Tenancy-Isolation**, um sicherzustellen, dass **Kunden (Firmen) niemals Daten von anderen Kunden sehen können**.

### Warum Multi-Tenancy?

Mehrere Sicherheitsdienst-Firmen nutzen diese App parallel. Jede Firma hat eigene:
- **Mitarbeiter (User)**
- **Objekte (Sites)**
- **Schichten (Shifts)**
- **Vorfälle (Incidents)**

**Ohne Isolation:** Firma A könnte Daten von Firma B sehen → **DATA BREACH!**

---

## 3-Ebenen-Architektur

### Ebene 1: Application-Level (Prisma-Middleware)

**Automatische Filterung aller Queries nach `customerId`.**

**Wie es funktioniert:**
1. User loggt sich ein → JWT-Token enthält `customerId`
2. Auth-Middleware dekodiert Token → `req.user.customerId` gesetzt
3. Express-Middleware (`setCustomerContext`) speichert `customerId` in AsyncLocalStorage
4. Prisma-Middleware liest `customerId` aus AsyncLocalStorage und filtert ALLE Queries

**Beispiel:**
```typescript
// Ohne Multi-Tenancy (GEFÄHRLICH!):
const users = await prisma.user.findMany(); // Gibt ALLE User zurück

// Mit Multi-Tenancy (SICHER!):
const users = await prisma.user.findMany();
// → Prisma-Middleware fügt automatisch hinzu: where: { customerId: 'abc123' }
// → Nur User von Firma "abc123" werden zurückgegeben
```

**Code:** `backend/src/middleware/multiTenancy.ts`

---

### Ebene 2: PostgreSQL Row-Level Security (RLS)

**Falls Application-Level versagt, blockt die Datenbank direkt.**

**Status:** ⏳ TODO (geplant für v1.25.0)

**Implementierung (geplant):**
```sql
-- Enable RLS for users table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see users from their customer
CREATE POLICY user_isolation ON "users"
  USING ("customerId" = current_setting('app.current_customer_id')::text);
```

**Vorteil:** Selbst bei Application-Bug kann DB-Ebene Datenleck verhindern.

---

### Ebene 3: RBAC (Role-Based Access Control)

**Zusätzliche Zugriffskontrolle pro Rolle.**

**Rollen:**
- `ADMIN`: Zugriff auf ALLE Customer-Daten (für Support/Dev)
- `MANAGER`: Zugriff nur auf eigenen Customer
- `DISPATCHER`: Lesen + Schreiben (eigener Customer)
- `EMPLOYEE`: Nur Lesen (eigener Customer)

**Code:** `backend/src/middleware/rbac.ts`

---

## Datenmodell

### User.customerId

**Prisma-Schema:**
```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  // ...

  // 🔐 MULTI-TENANCY
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)

  @@index([customerId], name: "users_customer_idx")
}
```

**Bedeutung:**
- Jeder User gehört zu genau EINEM Customer
- `onDelete: Restrict` → Customer kann nicht gelöscht werden, wenn noch User existieren
- Index für Performance

---

### Site.customerId

**Prisma-Schema:**
```prisma
model Site {
  id         String @id @default(cuid())
  name       String
  // ...

  // 🔐 MULTI-TENANCY
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])

  @@index([customerId], name: "sites_customer_idx")
}
```

**Bedeutung:**
- Sites gehören zu einem Customer
- `customerId` ist optional (für Migration), später PFLICHT

---

## JWT-Token-Struktur

**Token-Payload:**
```json
{
  "userId": "cla1b2c3d4e5",
  "role": "MANAGER",
  "customerId": "cus_abc123xyz",  // 🔐 Multi-Tenancy
  "iat": 1730841600,
  "exp": 1731446400
}
```

**Wichtig:**
- `customerId` wird bei **JEDEM Request** aus Token gelesen
- Falls Token manipuliert wird → Signature-Check schlägt fehl → 401 Unauthorized

**Code:** `backend/src/controllers/authController.ts` (Token-Erstellung)

---

## Request-Flow (mit Multi-Tenancy)

```
1. Client: POST /api/sites (mit JWT-Token im Authorization-Header)
   │
   ▼
2. Express-Middleware: authenticate (backend/src/middleware/auth.ts)
   │  → Dekodiert JWT-Token
   │  → Setzt req.user = { id, role, customerId }
   │
   ▼
3. Express-Middleware: setCustomerContext (backend/src/middleware/multiTenancy.ts)
   │  → Liest req.user.customerId
   │  → Speichert in AsyncLocalStorage (Request-Context)
   │
   ▼
4. Controller: siteController.createSite
   │  → Ruft prisma.site.create({ data: { name, customerId: req.user.customerId } })
   │
   ▼
5. Prisma-Middleware: registerMultiTenancyMiddleware
   │  → Liest customerId aus AsyncLocalStorage
   │  → Fügt automatisch zu allen Queries hinzu: where: { customerId }
   │
   ▼
6. PostgreSQL: Query wird ausgeführt (nur Daten von diesem Customer)
   │
   ▼
7. Response an Client
```

---

## Sicherheits-Tests

### Test 1: User kann NUR eigenen Customer sehen

```typescript
// Test: User von Firma A versucht User von Firma B zu laden
test('Multi-Tenancy: User isolation', async () => {
  // Setup: 2 Firmen mit je 1 User
  const customerA = await prisma.customer.create({ data: { companyName: 'Firma A' } });
  const customerB = await prisma.customer.create({ data: { companyName: 'Firma B' } });

  const userA = await prisma.user.create({
    data: { email: 'a@firma-a.de', customerId: customerA.id },
  });
  const userB = await prisma.user.create({
    data: { email: 'b@firma-b.de', customerId: customerB.id },
  });

  // Login als User A
  const tokenA = generateToken(userA.id, 'MANAGER', customerA.id);

  // Request: GET /api/users (als User A)
  const response = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${tokenA}`);

  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1); // Nur User A!
  expect(response.body.data[0].email).toBe('a@firma-a.de');
  expect(response.body.data).not.toContainEqual(
    expect.objectContaining({ email: 'b@firma-b.de' })
  ); // User B NICHT sichtbar!
});
```

### Test 2: Site-Isolation

```typescript
test('Multi-Tenancy: Site isolation', async () => {
  // Setup: Firma A mit Site, Firma B mit Site
  const customerA = await prisma.customer.create({ data: { companyName: 'Firma A' } });
  const customerB = await prisma.customer.create({ data: { companyName: 'Firma B' } });

  const siteA = await prisma.site.create({
    data: { name: 'Objekt A', customerId: customerA.id },
  });
  const siteB = await prisma.site.create({
    data: { name: 'Objekt B', customerId: customerB.id },
  });

  const userA = await prisma.user.create({
    data: { email: 'a@firma-a.de', customerId: customerA.id },
  });

  // Login als User A
  const tokenA = generateToken(userA.id, 'MANAGER', customerA.id);

  // Request: GET /api/sites (als User A)
  const response = await request(app)
    .get('/api/sites')
    .set('Authorization', `Bearer ${tokenA}`);

  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0].name).toBe('Objekt A');
  // Objekt B von Firma B ist NICHT sichtbar!
});
```

---

## Migration von bestehenden Daten

**Problem:** Bestehende User/Sites haben KEIN `customerId`.

**Lösung:** Migration erstellt automatisch "Standard-Kunde":

```sql
-- Erstellt Default-Customer "Standard Kunde (Migration)"
INSERT INTO "customers" (...) VALUES (...);

-- Weist alle bestehenden User diesem Customer zu
UPDATE "users" SET "customerId" = 'default_customer_id';
```

**Nacharbeit:** Admin muss echte Firmen anlegen und User/Sites zuordnen.

---

## FAQ

### Q: Was passiert wenn JWT-Token manipuliert wird?

**A:** Token-Signature-Check schlägt fehl → 401 Unauthorized.

### Q: Kann ein ADMIN User von allen Customers sehen?

**A:** Aktuell NEIN (Prisma-Middleware filtert für alle). Geplant: Separate Admin-Prisma-Instanz ohne Middleware.

### Q: Was passiert wenn customerId im Token fehlt?

**A:** Request wird durchgelassen, aber Prisma-Middleware filtert NICHT → Query gibt ALLE Daten zurück (nur bei Login/Public-Routes erlaubt).

### Q: Warum AsyncLocalStorage statt req.user?

**A:** AsyncLocalStorage ermöglicht automatische Filterung tief in Prisma-Middleware, ohne `req.user` durch alle Funktionen zu reichen.

---

## Bekannte Einschränkungen

1. **PostgreSQL RLS:** Noch nicht implementiert (geplant v1.25.0)
2. **Admin-Zugriff:** Aktuell keine Möglichkeit für ADMIN, alle Customer-Daten zu sehen
3. **Performance:** AsyncLocalStorage hat minimalen Overhead (~1-2ms pro Request)

---

## Weitere Dokumentation

- [Production Deployment](../ops/PRODUCTION_DEPLOYMENT.md)
- [Secret Rotation](../ops/SECRET_ROTATION.md)
- [RBAC Roles](../security/RBAC.md)

---

**Kontakt bei Sicherheitsfragen:** dev-team@secureops.de (Platzhalter)
