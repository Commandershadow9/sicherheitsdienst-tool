# Operations – Dokumentenspeicher

Dieses Verzeichnis enthält Skripte und Templates für den sicheren Dokumentenspeicher.

## Dateien

### Setup & Konfiguration
- `setup-document-storage.sh` – richtet ein LUKS-Volume ein, mountet es und schlägt `crypttab`/`fstab`-Einträge vor.
- `configure-firewall.sh` – Beispielskript für UFW-Regeln (Inbound-Ports nur für SSH/Web/API, Storage-Endpunkte nur lokal).
- `setup-https-letsencrypt.md` – **NEU**: Detaillierte Anleitung für HTTPS mit Let's Encrypt (benötigt Domain).

### Systemd Services
- `clamscan.service` & `clamscan.timer` – systemd-Units für einen nächtlichen Virenscan per ClamAV (02:30 Uhr).
- `borg-backup.service` & `borg-backup.timer` – systemd-Units für automatische verschlüsselte Backups (03:00 Uhr).
- `backup.sh` – BorgBackup-Helfer für inkrementelle Sicherungen von `DOCUMENT_STORAGE_ROOT`.

### Compliance & Dokumentation
- `dsgvo-compliance.md` – **NEU**: Vollständige DSGVO-Compliance-Dokumentation
  - Technische und Organisatorische Maßnahmen (TOM)
  - Verarbeitungsverzeichnis (Art. 30 DSGVO)
  - Löschkonzept
  - Incident Response Plan
  - Betroffenenrechte
  - AVV-Anforderungen
- `document-storage-checklist.md` – Checkliste/Audit-Vorlage für Einrichtung, Wartung und Wiederherstellung.
- `system-health.md` – Health-Check-Dokumentation.

## Vorgehen (Kurzfassung)

1. **Verschlüsseltes Volume anlegen**
   ```bash
   sudo ./setup-document-storage.sh \
     --luks-file /srv/vault/documents.luks \
     --size 20G \
     --mapper-name docstore \
     --mount-point /srv/documents \
     --owner svc-docstore \
     --group svc-docstore
   ```
   Anschließend `DOCUMENT_STORAGE_ROOT=/srv/documents` in `backend/.env` setzen.
   Wenn Docker genutzt wird, sicherstellen, dass `docker-compose.yml` den Bind-Mount `/srv/documents:/srv/documents` und die ENV `DOCUMENT_STORAGE_ROOT` im `api`-Service enthält.

2. **Firewall/VPN** – Regeln anpassen (z. B. `sudo ./configure-firewall.sh`) und ggf. nur vertrauenswürdige IPs/Bastion zulassen. Für VPN/SSH-Tunnel separate Anleitung nutzen.

3. **Virenscan aktivieren**
   ```bash
   sudo cp docs/ops/clamscan.service /etc/systemd/system/
   sudo cp docs/ops/clamscan.timer /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now clamscan.timer
   ```

4. **Backups einrichten**
   - `BORG_PASSPHRASE` setzen (z. B. in `/root/.config/borg/passphrase`).
   - `sudo ./backup.sh` zum Initialisieren & Testen.
   - Cron oder systemd-Timer anlegen (z. B. `sudo systemctl edit --force --full borg-documents.timer`).

5. **Checkliste führen** – `document-storage-checklist.md` kopieren und pro Inbetriebnahme aktualisieren (z. B. `/var/lib/sicherheitsdienst/checklists/documents-YYYYMMDD.md`).

> **Hinweis:** Skripte sind Vorlagen. Vor dem Einsatz Szenario prüfen, ggf. Pfade/Ports anpassen.

## Docker Compose (Prod vs Dev)

- Produktion: `docker compose up -d` nutzt `docker-compose.yml` (Traefik, API, DB, Redis, pgAdmin) – **ohne Mailhog**. SMTP-ENV sind optional; fehlende Werte bremsen den Start nicht.
- Entwicklung: `docker compose -f docker-compose.dev.yml up -d` zieht zusätzlich Mailhog (SMTP `1025`, UI `http://localhost:8025`) hoch; die API ist mit `SMTP_HOST=mailhog` verdrahtet.
- SMTP-Readiness-Checks sind per Default aus. Für produktive SMTP-Server einfach `SMTP_HOST`/`SMTP_PORT` in der Umgebung setzen.
