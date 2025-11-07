/**
 * ShiftRuleForm - Formular zum Erstellen und Bearbeiten von Schichtregeln
 *
 * Unterstützt alle Pattern-Typen mit dynamischen Feldern
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form'
import { AlertCircle } from 'lucide-react'
import type {
  ShiftRule,
  CreateShiftRuleInput,
  UpdateShiftRuleInput,
  RulePattern,
} from '../../types/shiftRule'
import { RULE_PATTERN_LABELS, WEEKDAY_LABELS_LONG } from '../../types/shiftRule'

type ShiftRuleFormProps = {
  siteId: string
  initialData?: ShiftRule
  onSubmit: (input: CreateShiftRuleInput | UpdateShiftRuleInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export default function ShiftRuleForm({
  siteId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ShiftRuleFormProps) {
  const isEditMode = !!initialData

  // Form state
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [startTime, setStartTime] = useState(initialData?.startTime || '')
  const [endTime, setEndTime] = useState(initialData?.endTime || '')
  const [requiredStaff, setRequiredStaff] = useState(
    initialData?.requiredStaff?.toString() || '1'
  )
  const [qualifications, setQualifications] = useState(
    initialData?.requiredQualifications?.join(', ') || ''
  )
  const [pattern, setPattern] = useState<RulePattern>(initialData?.pattern || 'WEEKLY')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialData?.daysOfWeek || [])
  const [specificDates, setSpecificDates] = useState<string[]>(
    initialData?.specificDates || []
  )
  const [specificDateInput, setSpecificDateInput] = useState('')
  const [validFrom, setValidFrom] = useState(
    initialData?.validFrom ? initialData.validFrom.split('T')[0] : ''
  )
  const [validUntil, setValidUntil] = useState(
    initialData?.validUntil ? initialData.validUntil.split('T')[0] : ''
  )
  const [priority, setPriority] = useState(initialData?.priority?.toString() || '0')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Toggle weekday
  const toggleWeekday = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  // Add specific date
  const addSpecificDate = () => {
    if (specificDateInput && !specificDates.includes(specificDateInput)) {
      setSpecificDates((prev) => [...prev, specificDateInput].sort())
      setSpecificDateInput('')
    }
  }

  // Remove specific date
  const removeSpecificDate = (date: string) => {
    setSpecificDates((prev) => prev.filter((d) => d !== date))
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Name ist erforderlich'
    if (!startTime.trim()) newErrors.startTime = 'Startzeit ist erforderlich'
    else if (!/^\d{2}:\d{2}$/.test(startTime))
      newErrors.startTime = 'Format: HH:MM (z.B. 06:00)'

    if (!endTime.trim()) newErrors.endTime = 'Endzeit ist erforderlich'
    else if (!/^\d{2}:\d{2}$/.test(endTime)) newErrors.endTime = 'Format: HH:MM (z.B. 14:00)'

    const staff = parseInt(requiredStaff)
    if (isNaN(staff) || staff < 1) newErrors.requiredStaff = 'Mindestens 1 Mitarbeiter'

    if (pattern === 'WEEKLY' && daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Wählen Sie mindestens einen Wochentag'
    }

    if (pattern === 'SPECIFIC_DATES' && specificDates.length === 0) {
      newErrors.specificDates = 'Fügen Sie mindestens ein Datum hinzu'
    }

    if (!validFrom) newErrors.validFrom = 'Gültig ab ist erforderlich'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const input: CreateShiftRuleInput | UpdateShiftRuleInput = {
      siteId,
      name: name.trim(),
      description: description.trim() || undefined,
      startTime,
      endTime,
      requiredStaff: parseInt(requiredStaff),
      requiredQualifications: qualifications
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean),
      pattern,
      daysOfWeek: pattern === 'WEEKLY' ? daysOfWeek : [],
      specificDates: pattern === 'SPECIFIC_DATES' ? specificDates : [],
      validFrom,
      validUntil: validUntil || undefined,
      priority: parseInt(priority),
      isActive,
    }

    onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <FormField label="Name *">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Frühschicht Mo-Fr, Nachtschicht Wochenende"
        />
        {errors.name && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.name}
          </p>
        )}
      </FormField>

      {/* Description */}
      <FormField label="Beschreibung">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional: Zusätzliche Details zur Schichtregel"
          rows={2}
        />
      </FormField>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Startzeit *">
          <Input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="HH:MM (z.B. 06:00)"
          />
          {errors.startTime && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.startTime}
            </p>
          )}
        </FormField>

        <FormField label="Endzeit *">
          <Input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="HH:MM (z.B. 14:00)"
          />
          {errors.endTime && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.endTime}
            </p>
          )}
        </FormField>
      </div>

      {/* Required Staff */}
      <FormField label="Benötigte Mitarbeiter *">
        <Input
          type="number"
          min="1"
          value={requiredStaff}
          onChange={(e) => setRequiredStaff(e.target.value)}
        />
        {errors.requiredStaff && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.requiredStaff}
          </p>
        )}
      </FormField>

      {/* Qualifications */}
      <FormField label="Benötigte Qualifikationen">
        <Input
          value={qualifications}
          onChange={(e) => setQualifications(e.target.value)}
          placeholder="Komma-getrennt: §34a, Erste Hilfe, Brandschutz"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mehrere Qualifikationen mit Komma trennen
        </p>
      </FormField>

      {/* Pattern */}
      <FormField label="Wiederholungs-Muster *">
        <Select value={pattern} onChange={(e) => setPattern(e.target.value as RulePattern)}>
          {Object.entries(RULE_PATTERN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {pattern === 'DAILY' && 'Schicht wird jeden Tag im Gültigkeitszeitraum generiert'}
          {pattern === 'WEEKLY' &&
            'Schicht wird nur an den ausgewählten Wochentagen generiert'}
          {pattern === 'SPECIFIC_DATES' && 'Schicht wird nur an den angegebenen Daten generiert'}
          {pattern === 'DATE_RANGE' && 'Schicht wird jeden Tag im Gültigkeitszeitraum generiert'}
        </p>
      </FormField>

      {/* Days of Week (only for WEEKLY pattern) */}
      {pattern === 'WEEKLY' && (
        <FormField label="Wochentage *">
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`
                  px-3 py-2 rounded text-sm font-medium border-2 transition-all
                  ${
                    daysOfWeek.includes(day)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }
                `}
              >
                {WEEKDAY_LABELS_LONG[day].substring(0, 2)}
              </button>
            ))}
          </div>
          {errors.daysOfWeek && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.daysOfWeek}
            </p>
          )}
        </FormField>
      )}

      {/* Specific Dates (only for SPECIFIC_DATES pattern) */}
      {pattern === 'SPECIFIC_DATES' && (
        <FormField label="Spezifische Daten *">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="date"
                value={specificDateInput}
                onChange={(e) => setSpecificDateInput(e.target.value)}
              />
              <Button type="button" onClick={addSpecificDate} variant="outline">
                Hinzufügen
              </Button>
            </div>
            {specificDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specificDates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {new Date(date).toLocaleDateString('de-DE')}
                    <button
                      type="button"
                      onClick={() => removeSpecificDate(date)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.specificDates && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.specificDates}
              </p>
            )}
          </div>
        </FormField>
      )}

      {/* Validity */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Gültig ab *">
          <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          {errors.validFrom && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.validFrom}
            </p>
          )}
        </FormField>

        <FormField label="Gültig bis">
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Optional: Leer lassen für unbegrenzt</p>
        </FormField>
      </div>

      {/* Priority */}
      <FormField label="Priorität">
        <Input
          type="number"
          min="0"
          max="100"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Höhere Priorität überschreibt niedrigere Regeln am gleichen Tag (0-100)
        </p>
      </FormField>

      {/* Is Active */}
      <FormField>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Regel ist aktiv</span>
        </label>
      </FormField>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Speichere...' : isEditMode ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </div>
    </form>
  )
}
