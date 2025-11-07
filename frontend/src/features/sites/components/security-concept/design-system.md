# Security Concept Design System

## Farbpalette

### Status Colors
```
DRAFT (Entwurf):     bg-slate-100 text-slate-700 border-slate-300
IN_REVIEW (Prüfung): bg-blue-100 text-blue-700 border-blue-300
APPROVED (Frei):     bg-emerald-100 text-emerald-700 border-emerald-300
ACTIVE (Aktiv):      bg-emerald-600 text-white border-emerald-700
EXPIRED (Abgelaufen):bg-amber-100 text-amber-700 border-amber-300
ARCHIVED (Archiv):   bg-slate-100 text-slate-600 border-slate-300
```

### Section Priority Colors
```
CRITICAL (Kritisch):  text-red-600 bg-red-50 border-red-200
IMPORTANT (Wichtig):  text-amber-600 bg-amber-50 border-amber-200
OPTIONAL (Optional):  text-slate-600 bg-slate-50 border-slate-200
```

### Completion Status
```
COMPLETE (✅):     bg-emerald-100 text-emerald-700
PARTIAL (⚠️):     bg-amber-100 text-amber-700
EMPTY (○):        bg-slate-100 text-slate-600
```

## Spacing System

```
Gap zwischen Sections:     space-y-3 (12px)
Padding innerhalb Cards:   p-4 (16px) / p-6 (24px für Header)
Margin für Groups:         mb-4 (16px)
Gap für Inline Elements:   gap-2 (8px) / gap-3 (12px)
```

## Typographie

```
Page Title:          text-2xl font-bold text-slate-900
Section Title:       text-base font-semibold text-slate-900
Group Header:        text-sm font-semibold text-slate-700 uppercase tracking-wide
Body Text:           text-sm text-slate-600
Labels:              text-xs font-medium text-slate-500 uppercase
Badge Text:          text-xs font-medium
```

## Component Patterns

### Edit/View Mode Toggle
- View Mode: Daten anzeigen mit "Bearbeiten" Button (rechts oben)
- Edit Mode: Formular mit "Speichern" + "Abbrechen" Buttons (rechts oben)
- Konsistente Button-Position in allen Editoren

### Badges
- Status-Badge: Links neben Titel (z.B. AKTIV, DRAFT)
- Completion-Badge: Rechts am Accordion (✅ Definiert, ○ Nicht definiert)
- Priority-Badge: Bei Section-Groups (🔴 KRITISCH, 🟡 WICHTIG)

### Section Groups
- Accordions gruppiert nach Priorität
- Kritische Sections initial geöffnet
- Konsistente Icons pro Section
- Keine bunten Gradients mehr (nur dezente bg-slate-50)

## Icons (lucide-react)

```
Shield:         Sicherheitskonzept, Security
Calendar:       Schichtmodell
AlertTriangle:  Risikobeurteilung, Notfall
Users:          Personal
Building2:      Objekt/Lagebild
Route:          Schutzmaßnahmen, Kontrollgänge
Briefcase:      Aufgabenprofile
Phone:          Kommunikation
BarChart3:      KPIs
RefreshCw:      Übergaben
FileText:       Anhänge, Dokumente
```

## Responsive Breakpoints

```
Mobile:  < 640px  - Single column, collapsed groups
Tablet:  640-1024px - Optimized spacing
Desktop: > 1024px - Full layout
```
