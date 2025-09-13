# UI Components (Atoms)

Kleine, einheitliche Bausteine (Atoms) für konsistentes UI – Fokus auf klare Defaults, gute Fokuszustände und einfache Zusammensetzung.

## Prinzipien
- Keine Inline‑Stile für Inputs/Buttons – immer Atoms nutzen.
- Formularkontrollen mit `FormField` kapseln (einheitlicher Label/Abstand).
- Tabellen über `DataTable` oder die Table‑Atoms (Table/THead/TBody/Tr/Th/Td).

## Atoms
- Button
```tsx
import { Button } from '@/components/ui/button'

<Button>Primär</Button>
<Button variant="link" onClick={...}>Als Link</Button>
```

- Input / Select
```tsx
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

<Input placeholder="Suche" />
<Select defaultValue=""><option value="">Alle</option></Select>
```

- FormField
```tsx
import { FormField } from '@/components/ui/form'

<FormField label="E‑Mail" htmlFor="email">
  <Input id="email" type="email" />
</FormField>
```

- Table (Atoms)
```tsx
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table'

<Table>
  <THead><Tr><Th>Name</Th><Th>E‑Mail</Th></Tr></THead>
  <TBody>
    <Tr><Td>Max</Td><Td>max@example.com</Td></Tr>
  </TBody>
</Table>
```

- Modal
```tsx
import { Modal } from '@/components/ui/modal'

<Modal open={open} onClose={()=>setOpen(false)} title="Titel">
  Inhalt …
</Modal>
```

## DataTable – sortierbar/paginierbar
- Spalten definieren (`sortable: true` für Sortierung)
- `onSort` toggelt asc/desc/aus
- Pagination über Props (page/pageSize/totalPages)

## Patterns
- Filterzeilen: `FormField` + `DebouncedInput` für Suche/Filter, `Select` für Auswahlen.
- Export‑Aktionen als `Button variant="link"` gruppieren.
- Icons in Tabellenköpfen werden automatisch angezeigt (Chevrons/Arrows) je Status.

## Dark‑Mode
- Tokens/Variablen vorhanden; Atoms nutzen die Farben automatisch. Dark‑Mode kann später erweitert werden.
