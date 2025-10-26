import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { FormField } from '@/components/ui/form'
import { Plus, Trash2, Clock, Edit2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ShiftModelType = '2-SHIFT' | '3-SHIFT' | 'ROTATING' | 'CUSTOM'

type Shift = {
  name: string
  start: string
  end: string
  requiredStaff: number
}

type ShiftModel = {
  model: ShiftModelType
  hoursPerWeek: number
  shifts: Shift[]
}

type ShiftModelEditorProps = {
  shiftModel: ShiftModel | null
  onSave: (model: ShiftModel) => void
  onCancel?: () => void
}

export default function ShiftModelEditor({ shiftModel, onSave, onCancel }: ShiftModelEditorProps) {
  const [editMode, setEditMode] = useState(!shiftModel)
  const [model, setModel] = useState<ShiftModelType>(shiftModel?.model || '2-SHIFT')
  const [hoursPerWeek, setHoursPerWeek] = useState(shiftModel?.hoursPerWeek || 168)
  const [shifts, setShifts] = useState<Shift[]>(
    shiftModel?.shifts || [
      { name: 'Frühschicht', start: '06:00', end: '18:00', requiredStaff: 1 },
      { name: 'Spätschicht', start: '18:00', end: '06:00', requiredStaff: 1 },
    ]
  )
  const [addShiftModal, setAddShiftModal] = useState(false)
  const [newShift, setNewShift] = useState<Shift>({ name: '', start: '08:00', end: '16:00', requiredStaff: 1 })

  const handleAddShift = () => {
    if (!newShift.name.trim()) {
      return
    }
    setShifts([...shifts, newShift])
    setNewShift({ name: '', start: '08:00', end: '16:00', requiredStaff: 1 })
    setAddShiftModal(false)
  }

  const handleDeleteShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index))
  }

  const handleUpdateShift = (index: number, updatedShift: Shift) => {
    setShifts(shifts.map((s, i) => (i === index ? updatedShift : s)))
  }

  const handleSave = () => {
    onSave({
      model,
      hoursPerWeek,
      shifts,
    })
    setEditMode(false)
  }

  const handleCancel = () => {
    if (shiftModel) {
      // Revert changes
      setModel(shiftModel.model)
      setHoursPerWeek(shiftModel.hoursPerWeek)
      setShifts(shiftModel.shifts)
      setEditMode(false)
    } else {
      // User is creating new, call onCancel
      onCancel?.()
    }
  }

  const modelTemplates = {
    '2-SHIFT': [
      { name: 'Tagschicht', start: '06:00', end: '18:00', requiredStaff: 1 },
      { name: 'Nachtschicht', start: '18:00', end: '06:00', requiredStaff: 1 },
    ],
    '3-SHIFT': [
      { name: 'Frühschicht', start: '06:00', end: '14:00', requiredStaff: 1 },
      { name: 'Spätschicht', start: '14:00', end: '22:00', requiredStaff: 1 },
      { name: 'Nachtschicht', start: '22:00', end: '06:00', requiredStaff: 1 },
    ],
    ROTATING: [
      { name: 'Woche A - Früh', start: '06:00', end: '14:00', requiredStaff: 1 },
      { name: 'Woche A - Spät', start: '14:00', end: '22:00', requiredStaff: 1 },
      { name: 'Woche B - Nacht', start: '22:00', end: '06:00', requiredStaff: 1 },
    ],
    CUSTOM: [],
  }

  const handleModelChange = (newModel: ShiftModelType) => {
    setModel(newModel)
    if (newModel !== 'CUSTOM' && modelTemplates[newModel]) {
      setShifts(modelTemplates[newModel])
    }
  }

  if (!editMode && shiftModel) {
    // View Mode
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <Clock size={18} />
            Schichtmodell
          </h4>
          <Button onClick={() => setEditMode(true)} variant="outline" size="sm" className="gap-2">
            <Edit2 size={14} />
            Bearbeiten
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoBox label="Modell" value={shiftModel.model} />
          <InfoBox label="Stunden/Woche" value={`${shiftModel.hoursPerWeek} h`} />
          <InfoBox label="Anzahl Schichten" value={shiftModel.shifts.length.toString()} />
        </div>

        <div className="space-y-2">
          {shiftModel.shifts.map((shift, idx) => (
            <ShiftCard key={idx} shift={shift} />
          ))}
        </div>
      </div>
    )
  }

  // Edit Mode
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Clock size={18} />
          Schichtmodell bearbeiten
        </h4>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" size="sm" className="gap-1">
            <X size={14} />
            Abbrechen
          </Button>
          <Button onClick={handleSave} size="sm" className="gap-1">
            <Save size={14} />
            Speichern
          </Button>
        </div>
      </div>

      {/* Model Type Selection */}
      <FormField label="Schichtmodell-Typ *">
        <Select
          value={model}
          onChange={(e) => handleModelChange(e.target.value as ShiftModelType)}
          className="w-full"
        >
          <option value="2-SHIFT">2-Schicht-System (Tag/Nacht)</option>
          <option value="3-SHIFT">3-Schicht-System (Früh/Spät/Nacht)</option>
          <option value="ROTATING">Wechselschicht</option>
          <option value="CUSTOM">Individuell</option>
        </Select>
      </FormField>

      {/* Hours per Week */}
      <FormField label="Betriebsstunden pro Woche *">
        <Input
          type="number"
          value={hoursPerWeek}
          onChange={(e) => setHoursPerWeek(Number(e.target.value))}
          min={0}
          max={168}
          className="w-full"
        />
        <p className="text-xs text-gray-600 mt-1">24/7 Betrieb = 168 Stunden</p>
      </FormField>

      {/* Shifts List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-medium text-sm">Schichten ({shifts.length})</label>
          <Button onClick={() => setAddShiftModal(true)} size="sm" variant="outline" className="gap-1">
            <Plus size={14} />
            Schicht hinzufügen
          </Button>
        </div>

        <div className="space-y-2">
          {shifts.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              Keine Schichten definiert. Füge eine Schicht hinzu.
            </div>
          )}

          {shifts.map((shift, idx) => (
            <EditableShiftCard
              key={idx}
              shift={shift}
              onUpdate={(updatedShift) => handleUpdateShift(idx, updatedShift)}
              onDelete={() => handleDeleteShift(idx)}
            />
          ))}
        </div>
      </div>

      {/* Add Shift Modal */}
      <Modal title="Schicht hinzufügen" open={addShiftModal} onClose={() => setAddShiftModal(false)}>
        <div className="space-y-4">
          <FormField label="Schicht-Name *">
            <Input
              value={newShift.name}
              onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
              placeholder="z.B. Frühschicht"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start *">
              <Input
                type="time"
                value={newShift.start}
                onChange={(e) => setNewShift({ ...newShift, start: e.target.value })}
              />
            </FormField>
            <FormField label="Ende *">
              <Input
                type="time"
                value={newShift.end}
                onChange={(e) => setNewShift({ ...newShift, end: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Benötigte Mitarbeiter *">
            <Input
              type="number"
              value={newShift.requiredStaff}
              onChange={(e) => setNewShift({ ...newShift, requiredStaff: Number(e.target.value) })}
              min={1}
            />
          </FormField>

          <div className="flex gap-2 justify-end">
            <Button onClick={() => setAddShiftModal(false)} variant="outline">
              Abbrechen
            </Button>
            <Button onClick={handleAddShift} disabled={!newShift.name.trim()}>
              Hinzufügen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Helper Components
function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function ShiftCard({ shift }: { shift: Shift }) {
  return (
    <div className="bg-white rounded-lg p-3 border shadow-sm flex items-center justify-between">
      <div>
        <p className="font-medium">{shift.name}</p>
        <p className="text-sm text-gray-600">
          {shift.start} - {shift.end} Uhr
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">Benötigt</p>
        <p className="font-semibold">{shift.requiredStaff} MA</p>
      </div>
    </div>
  )
}

function EditableShiftCard({
  shift,
  onUpdate,
  onDelete,
}: {
  shift: Shift
  onUpdate: (shift: Shift) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [localShift, setLocalShift] = useState(shift)

  const handleSave = () => {
    onUpdate(localShift)
    setEditing(false)
  }

  const handleCancel = () => {
    setLocalShift(shift)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-lg p-3 border shadow-sm flex items-center justify-between">
        <div>
          <p className="font-medium">{shift.name}</p>
          <p className="text-sm text-gray-600">
            {shift.start} - {shift.end} Uhr · {shift.requiredStaff} MA
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing(true)} variant="outline" size="sm">
            <Edit2 size={14} />
          </Button>
          <Button onClick={onDelete} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-300 space-y-3">
      <Input
        value={localShift.name}
        onChange={(e) => setLocalShift({ ...localShift, name: e.target.value })}
        placeholder="Schicht-Name"
        className="font-medium"
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="time"
          value={localShift.start}
          onChange={(e) => setLocalShift({ ...localShift, start: e.target.value })}
        />
        <Input
          type="time"
          value={localShift.end}
          onChange={(e) => setLocalShift({ ...localShift, end: e.target.value })}
        />
        <Input
          type="number"
          value={localShift.requiredStaff}
          onChange={(e) => setLocalShift({ ...localShift, requiredStaff: Number(e.target.value) })}
          min={1}
          placeholder="MA"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
          Abbrechen
        </Button>
        <Button onClick={handleSave} size="sm" className="flex-1">
          Speichern
        </Button>
      </div>
    </div>
  )
}
