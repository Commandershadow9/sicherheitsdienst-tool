# Milestone: Notifications v1 + Observability 2 (September 2025)

## Zielsetzung
- Push/E-Mail Benachrichtigungen produktionsreif und beobachtbar machen.
- Operative Transparenz erhöhen (Metriken/Zähler/Logs) und CSV-Exporte performancefreundlich.

## Scope (in)
- FCM-Integration produktiv: robuste Initialisierung, Fehler-Handling, Deaktivierung inaktiver Tokens, Setup-Doku.
- E-Mail-Templates (Basis): Subjekt/Text-Template, Parametrisierung, Tests.
- Observability: /stats erweitert (notifications email/push success/fail – umgesetzt), strukturierte Logs (JSON – umgesetzt, Doku ergänzt), ggf. Latenzindikatoren.
- Contract-Tests: Nightly-Workflow (Compose-Stack, Health-Wait, Dredd grün) – aktivieren.
- CSV-Streaming für Listen (Users/Sites/Shifts/Incidents/Events) – umgesetzt.

## Scope (out)
- Template-Editor/Assets, Queue/Workers, Alerting/Tracing in externen Systemen.

## Akzeptanzkriterien
- Given FCM-Creds, When Event mit Push-Flag erstellt/aktualisiert, Then Push wird gesendet, Fehler werden geloggt, inaktive Tokens deaktiviert; /stats zeigt push.success/fail.
- Given EMAIL_NOTIFY_SHIFTS=true, When Shift wird geändert, Then E-Mail wird via Template gesendet; /stats zeigt email.success/fail; Retry bleibt 1x.
- Given /stats, Then notifications.counters (email/push) sichtbar; Logs optional JSON mit Request-ID.
- Given nightly CI, Then Contract-Tests laufen grün (compose start, health wait, dredd), Logs und Teardown vorhanden.
- Given große Listen, Then CSV-Export streamt (keine Memory-Spitzen) und liefert identisches Format wie zuvor.

## API-/Schema-Änderungen
- OpenAPI /stats: notifications.counters (email/push success/fail) – ergänzt.
- Fehlerbeispiele: Provider-Fehler (Push/E-Mail) – in 5xx-Beispielen beschrieben.

## Teststrategie
- Unit: pushService (FCM success/failure, Token-Deaktivierung), emailService (Template-Anwendung + Retry), csv util (Escape/Streaming-Sanity), logger (JSON-Format setup).
- Integration: Events→Push; Shifts→Email; /stats counters; CSV responses.
- Contract: Dredd gegen /api/v1 (auth/users/sites/shifts/incidents/push)

## Risiken & Gegenmaßnahmen
- Provider-Instabilität: best-effort + Logging, Token-Deaktivierung, /stats counters.
- Spam/Rate-Limits: optionale ENV-Limits, erweiterbar.
- CSV Performance: Streaming implementiert; Beobachtung und ggf. Paginierungsempfehlung in Doku.

## Tickets (Auszug)
- P0: FCM-Integration produktiv (ENV, robustes Error-Handling, Token-Deaktivierung, Doku)
- P0: Contract-Tests nightly aktivieren (Schedule; compose; health; dredd)
- P1: E-Mail-Templates (Basis) + Tests
- P1: README: FCM Setup/Best Practices
- P2: Rate-Limits auf weitere Endpunkte (optional)

