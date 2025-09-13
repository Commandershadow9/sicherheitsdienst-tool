# API Cheatsheet

Kurzreferenz für häufige API‑Aufrufe, Parameter, Fehlercodes und RBAC.

Hinweis: Ersetze `<SERVER_IP>` und `<TOKEN>` entsprechend. Token erhältst du via `POST /api/auth/login` (siehe Beispiele unten).

## Auth
- Login
```bash
curl -sS 'http://<SERVER_IP>:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' | jq
```
- Refresh
```bash
curl -sS 'http://<SERVER_IP>:3000/api/auth/refresh' \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<REFRESH>"}' | jq
```

## Users
- RBAC: Lesen nur `ADMIN`, `DISPATCHER`
- Parameter (Query): `page`, `pageSize|pagesize`, `sortBy`, `sortDir`, `query`, `role`, `isActive`, `filter[...]`
- Defaults: `page=1`, `pageSize=25`, `sortBy=firstName`, `sortDir=asc`
- Fehler: 400 bei unbekanntem `sortBy`, 422 bei Typfehlern
- List
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users?page=1&pageSize=25&query=anna' -H "Authorization: Bearer <TOKEN>" | jq
```
- Export CSV/XLSX (gefiltert, ungepaginert)
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users?role=EMPLOYEE' -H "Authorization: Bearer <TOKEN>" -H 'Accept: text/csv' -o users.csv
curl -sS 'http://<SERVER_IP>:3000/api/users?isActive=true' -H "Authorization: Bearer <TOKEN>" -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' -o users.xlsx
```
- Fehlerbeispiele
```bash
curl -i 'http://<SERVER_IP>:3000/api/users?sortBy=doesNotExist' -H "Authorization: Bearer <TOKEN>"
curl -i 'http://<SERVER_IP>:3000/api/users?page=abc' -H "Authorization: Bearer <TOKEN>"
```

## Sites
- RBAC: Lesen alle authentifizierten Nutzer
- List + Export
```bash
curl -sS 'http://<SERVER_IP>:3000/api/sites?page=1&pageSize=25&sortBy=name&sortDir=asc&filter[city]=Muster' -H "Authorization: Bearer <TOKEN>" | jq
curl -sS 'http://<SERVER_IP>:3000/api/sites?filter[postalCode]=12345' -H "Authorization: Bearer <TOKEN>" -H 'Accept: text/csv' -o sites.csv
```

## Site‑Schichten
- RBAC: Lesen alle authentifizierten Nutzer
- List + Export (Accept)
```bash
SITE_ID=<id>
curl -sS "http://<SERVER_IP>:3000/api/sites/$SITE_ID/shifts" -H "Authorization: Bearer <TOKEN>" | jq
curl -sS "http://<SERVER_IP>:3000/api/sites/$SITE_ID/shifts" -H "Authorization: Bearer <TOKEN>" -H 'Accept: text/csv' -o site_${SITE_ID}_shifts.csv
```

## Shifts
- RBAC: Lesen alle authentifizierten Nutzer
- List + Export
```bash
curl -sS 'http://<SERVER_IP>:3000/api/shifts?page=1&pageSize=25&sortBy=startTime&sortDir=desc' -H "Authorization: Bearer <TOKEN>" | jq
curl -sS 'http://<SERVER_IP>:3000/api/shifts?page=1&pageSize=1' -H "Authorization: Bearer <TOKEN>" -H 'Accept: text/csv' -o shifts.csv
```
- Clock‑In/Out
```bash
SHIFT_ID=<id>
curl -sS -X POST "http://<SERVER_IP>:3000/api/shifts/$SHIFT_ID/clock-in" -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' -d '{"at":"2025-09-01T08:00:00Z"}' | jq
curl -sS -X POST "http://<SERVER_IP>:3000/api/shifts/$SHIFT_ID/clock-out" -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' -d '{"at":"2025-09-01T16:00:00Z","breakTime":30}' | jq
```

## Incidents
- RBAC: List/Get alle Auth; Create/Update/Delete nur `ADMIN`, `MANAGER`
- Beispiele
```bash
curl -sS 'http://<SERVER_IP>:3000/api/incidents?page=1&pageSize=25' -H "Authorization: Bearer <TOKEN>" | jq
curl -i -X POST 'http://<SERVER_IP>:3000/api/incidents' -H "Authorization: Bearer <TOKEN_EMPLOYEE>" -H 'Content-Type: application/json' -d '{"title":"X"}'
```

## Events
- RBAC: Lesen alle Auth, Schreiben `ADMIN`, `DISPATCHER`
- List/Export/PDF
```bash
curl -sS 'http://<SERVER_IP>:3000/api/events?page=1&pageSize=25' -H "Authorization: Bearer <TOKEN>" | jq
curl -sS 'http://<SERVER_IP>:3000/api/events?page=1&pageSize=1' -H "Authorization: Bearer <TOKEN>" -H 'Accept: text/csv' -o events.csv
EV_ID=<id>
curl -sS "http://<SERVER_IP>:3000/api/events/$EV_ID" -H "Authorization: Bearer <TOKEN>" -H 'Accept: application/pdf' -o event_${EV_ID}.pdf
```

## Notifications (Test)
- RBAC: `ADMIN`, `MANAGER`
```bash
curl -i -X POST 'http://<SERVER_IP>:3000/api/notifications/test' -H "Authorization: Bearer <TOKEN_ADMIN>"
```

## Push Tokens
- Eigene Tokens listen/registrieren/aktualisieren/löschen
```bash
curl -sS 'http://<SERVER_IP>:3000/api/push/tokens' -H "Authorization: Bearer <TOKEN>" | jq
curl -sS -X POST 'http://<SERVER_IP>:3000/api/push/tokens' -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' -d '{"token":"device-abc","platform":"web"}' | jq
curl -sS -X PUT 'http://<SERVER_IP>:3000/api/push/tokens/device-abc' -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' -d '{"platform":"web"}' | jq
curl -i -X DELETE 'http://<SERVER_IP>:3000/api/push/tokens/device-abc' -H "Authorization: Bearer <TOKEN>"
```
- Admin: Push‑Opt‑In/Out setzen
```bash
USER_ID=<id>
curl -sS -X PUT "http://<SERVER_IP>:3000/api/push/users/$USER_ID/opt" -H "Authorization: Bearer <TOKEN_ADMIN>" -H 'Content-Type: application/json' -d '{"pushOptIn":true}' | jq
```

