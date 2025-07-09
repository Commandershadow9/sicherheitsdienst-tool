# Sicherheitsdienst-Tool Backend

Dies ist das Backend für ein vollumfängliches Verwaltungstool für Sicherheitsdienste. Es stellt eine REST-API zur Verfügung, um Mitarbeiter, Schichten, Zeiterfassung und andere betriebliche Daten zu verwalten. Das Projekt ist mit Node.js, Express, TypeScript und Prisma gebaut und verwendet eine PostgreSQL-Datenbank.

## Aktueller Projektstatus

Das Projekt befindet sich in einem stabilen Entwicklungsstadium. Die grundlegende API-Struktur ist etabliert, und ein **vollständiges Authentifizierungssystem auf Basis von JSON Web Tokens (JWT) wurde erfolgreich implementiert und getestet.**

- **Grundfunktionen:** CRUD-Operationen für `Users` (Mitarbeiter) und `Shifts` (Schichten) sind angelegt.
- **Authentifizierung:** Benutzer können sich über `POST /api/auth/login` anmelden und erhalten einen gültigen Token.
- **Sicherheit:** Die Benutzer-Routen (`/api/users`) sind bereits durch eine Middleware geschützt und erfordern eine Authentifizierung per JWT.

## Technologie-Stack

- **Laufzeitumgebung:** Node.js
- **Framework:** Express.js
- **Sprache:** TypeScript
- **Datenbank-ORM:** Prisma
- **Datenbank:** PostgreSQL (kann über Docker ausgeführt werden)
- **Authentifizierung:** JSON Web Tokens (JWT) mit `bcryptjs` zum Hashen von Passwörtern.
- **Entwicklungsumgebung:** `ts-node` und `nodemon` für Live-Reloading.

---

## Setup & Installation (Für Entwickler)

Folge diesen Schritten, um das Projekt lokal aufzusetzen und zu starten:

1.  **Voraussetzungen:**
    - Node.js (v18 oder höher)
    - Docker und Docker Compose (für die PostgreSQL-Datenbank)

2.  **Repository klonen & installieren:**
    ```bash
    git clone <deine-repository-url>
    cd backend
    npm install
    ```

3.  **Datenbank starten:**
    - Starte den PostgreSQL-Container mit Docker Compose. Das Docker-Setup ist bereits in deiner `package.json` vorbereitet.
        ```bash
        npm run docker:up
        ```

4.  **Umgebungsvariablen konfigurieren:**
    - Kopiere die Vorlagedatei `.env.example` und erstelle daraus eine `.env`-Datei im `backend`-Hauptverzeichnis.
    - Passe die `DATABASE_URL` in der `.env`-Datei an deine lokalen PostgreSQL-Einstellungen an. Ersetze `username` und `password` mit den korrekten Zugangsdaten:
        ```env
        DATABASE_URL="postgresql://username:password@localhost:5432/sicherheitsdienst_db?schema=public"
        ```
    - Generiere einen sicheren `JWT_SECRET` (mindestens 32 zufällige Zeichen).

5.  **Datenbank migrieren und Seeden:**
    - Wende alle Prisma-Migrationen an, um die Datenbanktabellen zu erstellen, und fülle die Datenbank mit initialen Testdaten:
        ```bash
        npx prisma migrate dev
        npm run db:seed
        ```
    - Falls du die Datenbank zurücksetzen musst, kannst du `npm run db:reset` verwenden.

6.  **Server starten:**
    - Starte den Entwicklungsserver:
        ```bash
        npm run dev
        ```
    - Der Server sollte nun auf `http://localhost:3001` laufen.

### Verfügbare NPM-Skripte

- `npm run dev`: Startet den Server im Entwicklungsmodus mit Live-Reload.
- `npm run build`: Kompiliert den TypeScript-Code nach `./dist`.
- `npm run start`: Startet die kompilierte Anwendung aus dem `./dist`-Ordner.
- `npm run db:migrate`: Wendet Datenbank-Migrationen an.
- `npm run db:seed`: Füllt die Datenbank mit Testdaten aus `src/utils/seedData.ts`.
- `npm run db:studio`: Öffnet das Prisma Studio zur einfachen Datenbankverwaltung im Browser.

---

## Weiterer Entwicklungsplan (Roadmap)

Basierend auf dem ursprünglichen Plan sind dies die nächsten empfohlenen Schritte, um das Projekt weiterzuentwickeln.

### Phase 1: Kern-API fertigstellen und absichern

-   [ ] **`shiftRoutes.ts` absichern:** Die `authenticate`-Middleware zu allen Routen in `src/routes/shiftRoutes.ts` hinzufügen, um sicherzustellen, dass nur authentifizierte Benutzer auf Schichtdaten zugreifen können.
-   [ ] **Rollenbasierte Berechtigungen (`authorize`) implementieren:** Die bestehende `authorize`-Middleware aus `src/middleware/auth.ts` nutzen, um die API-Endpunkte granular abzusichern.
    -   **Beispiele:** Nur `ADMIN` und `DISPATCHER` dürfen neue Schichten erstellen. Nur `ADMIN` darf Benutzer löschen.
-   [ ] **Input-Validierung (Zod) implementieren:** Validierungsschemas im Ordner `src/validations/` erstellen und die `validate`-Middleware in den Routen einbinden, um die Datenintegrität sicherzustellen.

### Phase 2: Stabilität & Qualitätssicherung

-   [ ] **Strukturiertes Logging (Winston):** Eine `src/utils/logger.ts` erstellen, um Anfragen und Fehler strukturiert in Log-Dateien zu protokollieren.
-   [ ] **Tests schreiben (Jest):** Unit- und Integration-Tests für Controller und Services im `src/__tests__`-Verzeichnis erstellen.

### Phase 3: Neue Features & Dokumentation

-   [ ] **API-Dokumentation (Swagger):** `swagger-jsdoc` und `swagger-ui-express` implementieren, um eine interaktive API-Dokumentation unter einem `/api-docs`-Endpunkt bereitzustellen.
-   [ ] **Kernfeatures ausbauen:**
    -   **Zeiterfassung:** API für das Ein- und Ausstempeln (`TimeEntry`).
    -   **Vorfallmeldungen:** API für das Melden von Vorfällen (`Incident Reporting`).
