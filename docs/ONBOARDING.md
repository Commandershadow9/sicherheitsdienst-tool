# Onboarding Guide für neue Entwickler

**Willkommen im Sicherheitsdienst-Tool Projekt!** 🎉

Dieser Guide führt dich Schritt-für-Schritt in das Projekt ein.

---

## 📚 Vor dem Start: Was du lesen solltest

### Pflichtlektüre (30 Min)
1. **README.md** - Projekt-Überblick, Quickstart
2. **docs/PROJECT_STRUCTURE.md** - Wo findet man was?
3. **docs/ARCHITECTURE.md** - System-Architektur
4. **docs/RBAC.md** - Rollen & Berechtigungen

### Empfohlene Lektüre (1-2 Stunden)
1. **docs/FEATURE_OBJEKT_MANAGEMENT.md** - Vollständiges Konzept (Phase 1-8)
2. **docs/CHANGELOG.md** - Was wurde wann implementiert?
3. **docs/sessions/SESSION_2025-10-23.md** - Beispiel einer Session

---

## 🛠️ Setup (30-60 Min)

### 1. Voraussetzungen
```bash
# System-Requirements
- Docker & Docker Compose
- Node.js 22+ (für lokale Entwicklung)
- Git
- VS Code (empfohlen)
```

### 2. Repository klonen
```bash
git clone https://github.com/yourusername/sicherheitsdienst-tool.git
cd sicherheitsdienst-tool
```

### 3. Environment-Variablen
```bash
# Backend
cp backend/.env.example backend/.env
# Frontend (optional)
cp frontend/.env.example frontend/.env
```

**Wichtig:** Standard-Werte für Dev sind bereits in `docker-compose.dev.yml` gesetzt.

### 4. Docker-Stack starten
```bash
# Dev-Stack mit Auto-Seed
docker compose -f docker-compose.dev.yml up

# Warte bis alle Services bereit sind (~2 Minuten)
# Du siehst: "API started on port 3000"
```

### 5. Login testen
```bash
# Frontend öffnen
open http://localhost:5173

# Login mit:
# Email: admin@sicherheitsdienst.de
# Passwort: password123
```

✅ **Wenn du das Dashboard siehst, ist alles korrekt eingerichtet!**

---

## 🎯 Deine ersten Schritte

### Tag 1: Erkunden & Verstehen

#### 1. Frontend erkunden (30 Min)
- Einloggen als Admin
- Dashboard anschauen
- Navigation durchklicken:
  - **Schichten** - Schicht-Management
  - **Objekte** - Objekt-Verwaltung (Phase 1-6)
  - **Mitarbeiter** - Benutzer-Verwaltung
  - **Abwesenheiten** - Urlaub/Krankheit
  - **Kunden** - Kunden-Verwaltung (Phase 6)

#### 2. Ein Objekt anlegen (20 Min)
```
1. Gehe zu "Objekte" → "Neues Objekt (Wizard)"
2. Durchlaufe alle 8 Schritte:
   - Kunde: "Test GmbH" auswählen
   - Objekt: Namen eingeben, Adresse, Gebäudetyp
   - Sicherheitskonzept: Template "24/7 Objektschutz" auswählen
   - Personal: (überspringen)
   - Kontrollgänge: (überspringen)
   - Kalkulation: Stundensatz z.B. 35€ eingeben
   - Dokumente: (überspringen)
   - Zusammenfassung: "Objekt anlegen" klicken
3. Du landest auf der Objekt-Detail-Seite mit 7 Tabs
```

#### 3. Code-Struktur verstehen (1 Stunde)
```bash
# Backend anschauen
cd backend

# Wichtigste Controller lesen:
cat src/controllers/authController.ts      # Login-Logik
cat src/controllers/siteController.ts      # Objekt-Verwaltung
cat src/middleware/auth.ts                 # RBAC-Logik

# Prisma Schema ansehen:
cat prisma/schema.prisma | grep "^model"   # Alle Datenmodelle

# Frontend anschauen
cd ../frontend

# Wizard-Komponenten:
ls -la src/features/wizard/components/steps/

# API-Hooks:
cat src/features/sites/api.ts             # Objekt-API
cat src/features/customers/api.ts         # Kunden-API
```

---

### Tag 2: Erste Änderungen

#### 1. Backend: Neues Feld hinzufügen (1 Stunde)

**Aufgabe:** Füge ein `description`-Feld zum `Customer`-Model hinzu.

```bash
cd backend

# 1. Schema anpassen
vim prisma/schema.prisma
```

```prisma
model Customer {
  // ... bestehende Felder
  description String? @db.Text  // NEU
}
```

```bash
# 2. Migration erstellen
npx prisma migrate dev --name add_customer_description

# 3. Controller anpassen (optional)
vim src/controllers/customerController.ts

# 4. Tests ausführen
npm test -- customer
```

#### 2. Frontend: Feld anzeigen (1 Stunde)

```bash
cd frontend

# 1. Type aktualisieren
vim src/types/customer.ts
```

```typescript
export interface Customer {
  // ... bestehende Felder
  description?: string;  // NEU
}
```

```bash
# 2. CustomerDetail anpassen
vim src/features/customers/pages/CustomerDetail.tsx
```

```tsx
{/* Beschreibung anzeigen */}
{customer.description && (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h2 className="text-lg font-semibold mb-4">Beschreibung</h2>
    <p className="text-gray-700">{customer.description}</p>
  </div>
)}
```

```bash
# 3. Frontend neu starten (HMR lädt automatisch)
# Check: http://localhost:5173/customers/<customer-id>
```

✅ **Wenn du die Beschreibung siehst, hast du erfolgreich ein Feature hinzugefügt!**

---

### Tag 3: Testing & Best Practices

#### 1. Backend-Test schreiben (1 Stunde)

```bash
cd backend

# Neuen Test erstellen
vim src/__tests__/customer.test.ts
```

```typescript
import request from 'supertest';
import app from '../app';

describe('GET /api/customers/:id', () => {
  it('should return customer with description', async () => {
    const response = await request(app)
      .get('/api/customers/test-id')
      .set('Authorization', 'Bearer YOUR_TOKEN')
      .expect(200);

    expect(response.body).toHaveProperty('description');
  });
});
```

```bash
# Tests ausführen
npm test
```

#### 2. Frontend-Test schreiben (1 Stunde)

```bash
cd frontend

# Neuen Test erstellen
vim src/features/customers/__tests__/CustomerDetail.test.tsx
```

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CustomerDetail from '../pages/CustomerDetail';

describe('CustomerDetail', () => {
  it('should display customer description', () => {
    // Mock-Daten
    const mockCustomer = {
      id: '1',
      companyName: 'Test GmbH',
      description: 'Test Beschreibung',
      // ... weitere Felder
    };

    render(<CustomerDetail customer={mockCustomer} />);

    expect(screen.getByText('Test Beschreibung')).toBeInTheDocument();
  });
});
```

```bash
# Tests ausführen
npm test
```

---

## 🎓 Wichtige Konzepte verstehen

### 1. RBAC (Role-Based Access Control)

**Backend:**
```typescript
// Middleware verwenden
router.get('/',
  authenticate,                              // JWT prüfen
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),  // Rolle prüfen
  getCustomers
);
```

**Frontend:**
```tsx
// Komponente schützen
<RequireRole roles={['ADMIN', 'MANAGER']}>
  <CustomerForm />
</RequireRole>
```

### 2. React Query Pattern

```typescript
// API-Hook definieren (features/*/api.ts)
export const useCustomers = () => {
  return useQuery<CustomersResponse>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data;
    },
  });
};

// In Komponente verwenden
const { data, isLoading } = useCustomers();
```

### 3. Prisma Workflow

```bash
# 1. Schema ändern
vim prisma/schema.prisma

# 2. Migration erstellen
npx prisma migrate dev --name your_migration_name

# 3. Types neu generieren
npx prisma generate

# 4. In Code verwenden
const customer = await prisma.customer.findUnique({ where: { id } });
```

---

## 🐛 Häufige Probleme & Lösungen

### Problem: "Cannot connect to database"
```bash
# Lösung: Docker-Stack neu starten
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up
```

### Problem: "Port already in use"
```bash
# Lösung: Port-Konflikte prüfen
docker ps                           # Laufende Container
lsof -i :3000                       # Welcher Prozess nutzt Port 3000?
pkill -f "node"                    # Alle Node-Prozesse beenden
```

### Problem: "Migration failed"
```bash
# Lösung: Datenbank zurücksetzen (Dev only!)
cd backend
npx prisma migrate reset
npx prisma migrate deploy
npm run seed
```

### Problem: "TypeScript errors after pull"
```bash
# Lösung: Dependencies neu installieren
cd backend && npm ci
cd ../frontend && npm ci
npx prisma generate
```

### Problem: "Tests failing"
```bash
# Lösung: Test-Datenbank zurücksetzen
cd backend
npm run test:reset
npm test
```

---

## 📖 Weiterführende Ressourcen

### Code-Beispiele
- **Wizard-Implementation:** `frontend/src/features/wizard/`
- **Scoring-System:** `backend/src/services/intelligentReplacement.ts`
- **PDF-Generator:** `backend/src/utils/pdfGenerator.ts`
- **Email-Service:** `backend/src/services/emailService.ts`

### Dokumentation
- **API-Docs:** http://localhost:3000/api-docs (im Dev-Modus)
- **OpenAPI-Spec:** `docs/openapi.yaml`
- **Prisma Studio:** `npx prisma studio` (Datenbank-GUI)

### Git-Workflow
```bash
# 1. Neue Branch erstellen
git checkout -b feature/your-feature

# 2. Änderungen committen
git add .
git commit -m "feat: your feature description"

# 3. Tests ausführen
npm test

# 4. Push & PR erstellen
git push origin feature/your-feature
# → Gehe zu GitHub und erstelle Pull Request
```

### Code-Standards
- **TypeScript:** Strikte Typisierung, keine `any`
- **ESLint:** `npm run lint` vor Commit
- **Prettier:** Auto-Format in VS Code aktivieren
- **Tests:** Mindestens 80% Coverage für neue Features
- **Commits:** Conventional Commits Format (`feat:`, `fix:`, `docs:`)

---

## 🎯 Nächste Lernziele

### Woche 1: Basics verstehen
- ✅ Setup funktioniert
- ✅ Erste Änderung deployed
- ✅ Tests geschrieben
- ✅ RBAC verstanden

### Woche 2: Feature-Entwicklung
- [ ] Kleines Feature selbstständig implementiert (Backend + Frontend)
- [ ] Code-Review erhalten und umgesetzt
- [ ] Dokumentation geschrieben

### Woche 3: Advanced Topics
- [ ] Scoring-System verstanden
- [ ] Komplexes Feature implementiert (z.B. neue Phase)
- [ ] Migration geschrieben
- [ ] Performance-Optimierung durchgeführt

---

## 💬 Hilfe bekommen

### Im Team
- **Slack:** #dev-sicherheitsdienst-tool
- **Daily Standup:** 10:00 Uhr
- **Code-Review:** Jeden PR taggen mit @reviewers

### Dokumentation durchsuchen
```bash
# Suche in allen Docs
grep -r "your search term" docs/

# Suche nach Konzept
grep -r "Kontrollgänge" docs/planning/

# Suche nach Implementation
grep -r "intelligentReplacement" backend/src/
```

### KI-Assistenten nutzen
- **Claude Code:** `.claude/.clinerules` lesen
- **GitHub Copilot:** Context aus `docs/` nutzen
- **ChatGPT:** `docs/PROJECT_STRUCTURE.md` als Context geben

---

## 🎉 Du bist bereit!

Nach diesem Guide solltest du:
- ✅ Das Projekt lokal laufen haben
- ✅ Die Code-Struktur verstehen
- ✅ Erste Änderungen machen können
- ✅ Tests schreiben können
- ✅ Wissen, wo du Hilfe bekommst

**Viel Erfolg!** 🚀

---

**Letzte Aktualisierung:** 2025-10-23
**Nächste Review:** Bei größeren Architektur-Änderungen
