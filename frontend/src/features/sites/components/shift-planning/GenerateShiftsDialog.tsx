/**
 * GenerateShiftsDialog - Dialog für die Generierung von Schichten aus Regeln
 *
 * Ermöglicht Auswahl eines Datumsbereichs und Preview der zu generierenden Schichten
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { Calendar, Clock, UserCheck, AlertCircle, CheckCircle, Play } from 'lucide-react'
import { generateShiftsFromRules } from '../../api/shiftRuleApi'
import type { GenerateShiftsInput, GenerateShiftsResponse } from '../../types/shiftRule'

type GenerateShiftsDialogProps = {
  siteId: string
  isOpen: boolean
  onClose: () => void
}

export default function GenerateShiftsDialog({
  siteId,
  isOpen,
  onClose,
}: GenerateShiftsDialogProps) {
  const queryClient = useQueryClient()

  // Form state
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.toISOString().split('T')[0]
  })

  // Preview state
  const [previewData, setPreviewData] = useState<GenerateShiftsResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate dates
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!startDate) newErrors.startDate = 'Startdatum ist erforderlich'
    if (!endDate) newErrors.endDate = 'Enddatum ist erforderlich'

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'Enddatum muss nach Startdatum liegen'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: (input: GenerateShiftsInput) => generateShiftsFromRules(siteId, input),
    onSuccess: (data) => {
      setPreviewData(data)
      setShowPreview(true)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Laden der Vorschau')
    },
  })

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: (input: GenerateShiftsInput) => generateShiftsFromRules(siteId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', siteId] })
      toast.success(`${data.generated} Schichten erfolgreich generiert`)
      onClose()
      setPreviewData(null)
      setShowPreview(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Generieren der Schichten')
    },
  })

  // Handle preview
  const handlePreview = () => {
    if (!validate()) return

    previewMutation.mutate({
      startDate,
      endDate,
      preview: true,
    })
  }

  // Handle generate
  const handleGenerate = () => {
    if (!validate()) return

    generateMutation.mutate({
      startDate,
      endDate,
      preview: false,
    })
  }

  // Reset and close
  const handleClose = () => {
    setPreviewData(null)
    setShowPreview(false)
    setErrors({})
    onClose()
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Format time for display
  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Schichten generieren" size="lg">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Schichten aus Regeln generieren</p>
              <p>
                Wählen Sie einen Datumsbereich. Das System wendet alle aktiven Schichtregeln mit
                Prioritäts-basierter Überschreibung an.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        {!showPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Startdatum *">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.startDate}
                  </p>
                )}
              </FormField>

              <FormField label="Enddatum *">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                {errors.endDate && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.endDate}
                  </p>
                )}
              </FormField>
            </div>

            {/* Date Range Info */}
            {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                <p>
                  <strong>Zeitraum:</strong> {formatDate(startDate)} bis {formatDate(endDate)}
                </p>
                <p className="mt-1">
                  <strong>Dauer:</strong>{' '}
                  {Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{' '}
                  Tage
                </p>
              </div>
            )}
          </div>
        )}

        {/* Preview Results */}
        {showPreview && previewData && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">
                    {previewData.generated} Schicht{previewData.generated !== 1 ? 'en' : ''} werden
                    generiert
                  </p>
                  <p>
                    Zeitraum: {formatDate(startDate)} bis {formatDate(endDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview List */}
            {previewData.shifts.length > 0 && (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Regel
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Zeit
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        MA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.shifts.map((shift, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{shift.ruleName}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(shift.startTime)}, {formatTime(shift.startTime)} -{' '}
                            {formatTime(shift.endTime)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <UserCheck size={12} />
                            {shift.requiredStaff}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {previewData.shifts.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <AlertCircle size={24} className="text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-900">
                  Keine Schichten im gewählten Zeitraum. Prüfen Sie die Gültigkeitsdaten Ihrer
                  Regeln.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={generateMutation.isPending}>
            Abbrechen
          </Button>

          <div className="flex gap-2">
            {!showPreview && (
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? 'Lade Vorschau...' : 'Vorschau anzeigen'}
              </Button>
            )}

            {showPreview && (
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Zurück
              </Button>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || (showPreview && previewData?.generated === 0)}
            >
              <Play size={16} className="mr-1" />
              {generateMutation.isPending ? 'Generiere...' : 'Jetzt generieren'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
