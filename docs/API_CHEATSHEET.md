# API Cheatsheet

Kurzreferenz für häufige API‑Aufrufe, Parameter, Fehlercodes und RBAC. Enthält Varianten für Bash/cURL und HTTPie sowie Hinweise für PowerShell.

Hinweis: Ersetze `<SERVER_IP>` und `<TOKEN>` entsprechend – oder verwende die folgenden Variablen‑Setups.

## Konventionen & Setup

Bash (macOS/Linux)
```bash
SERVER=<SERVER_IP>
BASE="http://$SERVER:3000"

# Login (holt accessToken und refreshToken)
LOGIN_JSON=$(curl -sS "$BASE/api/auth/login" \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}')
TOKEN=$(echo "$LOGIN_JSON" | jq -r '.accessToken')
REFRESH=$(echo "$LOGIN_JSON" | jq -r '.refreshToken')
echo "Access: ${TOKEN:0:12}…  Refresh: ${REFRESH:0:12}…"
```

PowerShell (Windows)
```powershell
$SERVER = '<SERVER_IP>'
$BASE   = "http://$SERVER:3000"

# Login
$Body = @{ email = 'admin@sicherheitsdienst.de'; password = 'password123' } | ConvertTo-Json
$LOGIN_JSON = Invoke-RestMethod -Method Post -Uri "$BASE/api/auth/login" -ContentType 'application/json' -Body $Body
$TOKEN = $LOGIN_JSON.accessToken
$REFRESH = $LOGIN_JSON.refreshToken
Write-Host "Access: $($TOKEN.Substring(0,12))…  Refresh: $($REFRESH.Substring(0,12))…"
```

HTTPie (optional)
```bash
http --print=b POST "$BASE/api/auth/login" email=admin@sicherheitsdienst.de password=password123
```

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

## Audit Logs (ADMIN)
- Liste abrufen (Filter & Paging)
```bash
curl -sS "$BASE/api/audit-logs?page=1&pageSize=25&actorId=admin&resourceType=SHIFT&from=2025-09-17T00:00:00Z&to=2025-09-19T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" | jq

# HTTPie mit Filterparametern
http "$BASE/api/audit-logs" "Authorization: Bearer $TOKEN" \\
  page==1 pageSize==25 actorId==admin resourceType==SHIFT action==SHIFT.ASSIGN outcome==SUCCESS
```
- CSV-Export
```bash
curl -sS "$BASE/api/audit-logs/export?format=csv&from=2025-09-17T00:00:00Z&to=2025-09-19T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o audit_logs.csv
# HTTPie
http --download "$BASE/api/audit-logs/export" "Authorization: Bearer $TOKEN" format==csv actorId==admin -o audit_logs.csv
```

## Users
- RBAC: Lesen nur `ADMIN`, `DISPATCHER`
- Parameter (Query): `page`, `pageSize|pagesize`, `sortBy`, `sortDir`, `query`, `role`, `isActive`, `filter[...]`
- Defaults: `page=1`, `pageSize=25`, `sortBy=firstName`, `sortDir=asc`
- Fehler: 400 bei unbekanntem `sortBy`, 422 bei Typfehlern
- List
```bash
# cURL
curl -sS "$BASE/api/users?page=1&pageSize=25&query=anna" -H "Authorization: Bearer $TOKEN" | jq

# HTTPie
http "$BASE/api/users" "Authorization: Bearer $TOKEN" page==1 pageSize==25 query==anna
```
- Export CSV/XLSX (gefiltert, ungepaginert)
```bash
# CSV
curl -sS "$BASE/api/users?role=EMPLOYEE" -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o users.csv
# XLSX
curl -sS "$BASE/api/users?isActive=true" -H "Authorization: Bearer $TOKEN" -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' -o users.xlsx

# HTTPie CSV
http --download "$BASE/api/users" "Authorization: Bearer $TOKEN" Accept:'text/csv' role==EMPLOYEE -o users.csv
```
- Fehlerbeispiele
```bash
curl -i "$BASE/api/users?sortBy=doesNotExist" -H "Authorization: Bearer $TOKEN"
curl -i "$BASE/api/users?page=abc" -H "Authorization: Bearer $TOKEN"
```

## Sites
- RBAC: Lesen alle authentifizierten Nutzer
- List + Export
```bash
curl -sS "$BASE/api/sites?page=1&pageSize=25&sortBy=name&sortDir=asc&filter[city]=Muster" -H "Authorization: Bearer $TOKEN" | jq
curl -sS "$BASE/api/sites?filter[postalCode]=12345" -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o sites.csv

# HTTPie
http "$BASE/api/sites" "Authorization: Bearer $TOKEN" page==1 pageSize==25 sortBy==name sortDir==asc filter[city]==Muster
```

## Site‑Schichten
- RBAC: Lesen alle authentifizierten Nutzer
- List + Export (Accept)
```bash
SITE_ID=<id>
curl -sS "$BASE/api/sites/$SITE_ID/shifts" -H "Authorization: Bearer $TOKEN" | jq
curl -sS "$BASE/api/sites/$SITE_ID/shifts" -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o site_${SITE_ID}_shifts.csv

# HTTPie
http "$BASE/api/sites/$SITE_ID/shifts" "Authorization: Bearer $TOKEN"
```

## Shifts
- RBAC: Lesen alle authentifizierten Nutzer
- List + Export
```bash
curl -sS "$BASE/api/shifts?page=1&pageSize=25&sortBy=startTime&sortDir=desc" -H "Authorization: Bearer $TOKEN" | jq
curl -sS "$BASE/api/shifts?page=1&pageSize=1" -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o shifts.csv

# HTTPie
http "$BASE/api/shifts" "Authorization: Bearer $TOKEN" page==1 pageSize==25 sortBy==startTime sortDir==desc
```
- Clock‑In/Out
```bash
SHIFT_ID=<id>
curl -sS -X POST "$BASE/api/shifts/$SHIFT_ID/clock-in" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"at":"2025-09-01T08:00:00Z"}' | jq
curl -sS -X POST "$BASE/api/shifts/$SHIFT_ID/clock-out" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"at":"2025-09-01T16:00:00Z","breakTime":30}' | jq

# HTTPie
http POST "$BASE/api/shifts/$SHIFT_ID/clock-in" "Authorization: Bearer $TOKEN" at="2025-09-01T08:00:00Z"
http POST "$BASE/api/shifts/$SHIFT_ID/clock-out" "Authorization: Bearer $TOKEN" at="2025-09-01T16:00:00Z" breakTime:=30
```

**Rate-Limits & RBAC**
- `POST /api/shifts/:id/assign` benötigt Rollen `ADMIN` oder `DISPATCHER` und nutzt `SHIFT_ASSIGN_RATE_LIMIT_*` zusätzlich zum globalen Schreib-Limiter.
- `POST /api/shifts/:id/clock-in` & `POST /api/shifts/:id/clock-out` teilen sich den Limiter `SHIFT_CLOCK_RATE_LIMIT_*`; Header `Retry-After` und `RateLimit-Reset` geben Wartedauer vor.

## Incidents
- RBAC: List/Get alle Auth; Create/Update/Delete nur `ADMIN`, `MANAGER`
- Beispiele
```bash
curl -sS "$BASE/api/incidents?page=1&pageSize=25" -H "Authorization: Bearer $TOKEN" | jq
curl -i -X POST "$BASE/api/incidents" -H "Authorization: Bearer $TOKEN_EMPLOYEE" -H 'Content-Type: application/json' -d '{"title":"X"}'

# HTTPie
http "$BASE/api/incidents" "Authorization: Bearer $TOKEN" page==1 pageSize==25
```

## Events
- RBAC: Lesen alle Auth, Schreiben `ADMIN`, `DISPATCHER`
- List/Export/PDF
```bash
curl -sS "$BASE/api/events?page=1&pageSize=25" -H "Authorization: Bearer $TOKEN" | jq
curl -sS "$BASE/api/events?page=1&pageSize=1" -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o events.csv
EV_ID=<id>
curl -sS "$BASE/api/events/$EV_ID" -H "Authorization: Bearer $TOKEN" -H 'Accept: application/pdf' -o event_${EV_ID}.pdf

# HTTPie
http "$BASE/api/events" "Authorization: Bearer $TOKEN" page==1 pageSize==25
```

## Notifications (Test)
- RBAC: `ADMIN`, `MANAGER`
```bash
curl -i -X POST "$BASE/api/notifications/test" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"channel":"email","recipient":"jane.doe@example.com","title":"Test","body":"Hallo"}'

# Push-Test (userIds verpflichtend)
curl -i -X POST "$BASE/api/notifications/test" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"channel":"push","title":"Neuer Vorfall","body":"Bitte prüfen","userIds":["'$USER_ID'"]}'

# HTTPie
http -v POST "$BASE/api/notifications/test" "Authorization: Bearer $TOKEN_ADMIN" channel=email recipient=jane.doe@example.com title=Test body=Hallo
```

- Templates: `GET /api/notifications/templates`
```bash
http "$BASE/api/notifications/templates" "Authorization: Bearer $TOKEN_ADMIN"
```
- Opt-In/Out: `GET|PUT /api/notifications/preferences/me`
```bash
http "$BASE/api/notifications/preferences/me" "Authorization: Bearer $TOKEN"
http PUT "$BASE/api/notifications/preferences/me" "Authorization: Bearer $TOKEN" emailOptIn:=false
```
- Echtzeit-Events (SSE)
```bash
curl -N -H "Authorization: Bearer $TOKEN_ADMIN" "$BASE/api/notifications/events?channel=email,push"
```

## Push Tokens
- Eigene Tokens listen/registrieren/aktualisieren/löschen
```bash
curl -sS "$BASE/api/push/tokens" -H "Authorization: Bearer $TOKEN" | jq
curl -sS -X POST "$BASE/api/push/tokens" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"token":"device-abc","platform":"web"}' | jq
curl -sS -X PUT "$BASE/api/push/tokens/device-abc" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"platform":"web"}' | jq
curl -i -X DELETE "$BASE/api/push/tokens/device-abc" -H "Authorization: Bearer $TOKEN"

# HTTPie
http "$BASE/api/push/tokens" "Authorization: Bearer $TOKEN"
http POST "$BASE/api/push/tokens" "Authorization: Bearer $TOKEN" token=device-abc platform=web
http PUT "$BASE/api/push/tokens/device-abc" "Authorization: Bearer $TOKEN" platform=web
http DELETE "$BASE/api/push/tokens/device-abc" "Authorization: Bearer $TOKEN"
```
- Admin: Push‑Opt‑In/Out setzen
```bash
USER_ID=<id>
curl -sS -X PUT "http://<SERVER_IP>:3000/api/push/users/$USER_ID/opt" -H "Authorization: Bearer <TOKEN_ADMIN>" -H 'Content-Type: application/json' -d '{"pushOptIn":true}' | jq
```
