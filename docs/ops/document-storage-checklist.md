# Dokumentenspeicher – Checkliste & Audit Trail

| Aufgabe | Verantwortlich | Datum | Bemerkung |
| --- | --- | --- | --- |
| LUKS-Container angelegt (`setup-document-storage.sh`) | | | |
| Mount eingerichtet (`/etc/crypttab`, `/etc/fstab`, systemd) | | | |
| `DOCUMENT_STORAGE_ROOT` in Backend-Env gesetzt | | | |
| Backend/API neu gestartet | | | |
| Test-Upload/-Download erfolgreich | | | |
| Firewall/VPN-Regeln aktualisiert | | | |
| ClamAV installiert (`clamd`, `freshclam`) | | | |
| `clamscan.service`/`.timer` aktiviert | | | |
| Quarantäne-Verzeichnis erstellt (z. B. `/var/quarantine`) | | | |
| BorgBackup initialisiert (`backup.sh`) | | | |
| Backup & Restore-Test durchgeführt | | | |
| Lösch-/Retention-Policy dokumentiert | | | |
| Vertrag/AVV mit Hosting-Provider geprüft | | | |

## Notizen

- **Passphrase-Verwaltung:** Passworttresor-Eintrag aktualisieren.
- **Monitoring:** Syslog/Audit-Log-Einträge prüfen, Prometheus-Alarm konfigurieren.
- **Wiederherstellung:** `borg extract` Testquartal in Staging-System.
- **Incident Response:** SOP für Datenpannen aktualisieren.

> Vorlage kopieren (`cp docs/ops/document-storage-checklist.md /var/lib/sicherheitsdienst/checklists/doc-YYYYMMDD.md`) und pro Durchlauf ausfüllen.
