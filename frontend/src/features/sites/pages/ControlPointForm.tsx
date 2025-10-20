import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form'
import { toast } from 'sonner'
import { Loader2, MapPin, Smartphone, QrCode, ArrowLeft } from 'lucide-react'
import { SkeletonForm } from '@/components/ui/skeleton'
import {
  fetchControlPoint,
  createControlPoint,
  updateControlPoint,
  generateQRCode,
  type ControlPoint,
} from '../controlApi'

type ControlPointFormData = {
  name: string
  location: string
  instructions: string
  nfcTagId: string
  qrCode: string
  order: number
  latitude: string
  longitude: string
  isActive: boolean
}

const INITIAL_FORM_DATA: ControlPointFormData = {
  name: '',
  location: '',
  instructions: '',
  nfcTagId: '',
  qrCode: '',
  order: 0,
  latitude: '',
  longitude: '',
  isActive: true,
}

export default function ControlPointForm() {
  const { siteId, pointId } = useParams<{ siteId: string; pointId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<ControlPointFormData>(INITIAL_FORM_DATA)
  const isEditMode = pointId !== 'new'

  // Fetch existing control point for edit mode
  const { data: existingPoint, isLoading } = useQuery({
    queryKey: ['controlPoint', siteId, pointId],
    queryFn: () => fetchControlPoint(siteId!, pointId!),
    enabled: isEditMode && !!siteId && !!pointId,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingPoint) {
      setFormData({
        name: existingPoint.name || '',
        location: existingPoint.location || '',
        instructions: existingPoint.instructions || '',
        nfcTagId: existingPoint.nfcTagId || '',
        qrCode: existingPoint.qrCode || '',
        order: existingPoint.order || 0,
        latitude: existingPoint.latitude?.toString() || '',
        longitude: existingPoint.longitude?.toString() || '',
        isActive: existingPoint.isActive ?? true,
      })
    }
  }, [existingPoint])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ControlPointFormData) =>
      createControlPoint(siteId!, {
        name: data.name,
        location: data.location,
        instructions: data.instructions || undefined,
        nfcTagId: data.nfcTagId || undefined,
        qrCode: data.qrCode || undefined,
        order: data.order,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlPoints', siteId] })
      toast.success('Kontrollpunkt erfolgreich angelegt')
      navigate(`/sites/${siteId}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Anlegen des Kontrollpunkts')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ControlPointFormData) =>
      updateControlPoint(siteId!, pointId!, {
        name: data.name,
        location: data.location,
        instructions: data.instructions || undefined,
        nfcTagId: data.nfcTagId || undefined,
        qrCode: data.qrCode || undefined,
        order: data.order,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlPoints', siteId] })
      queryClient.invalidateQueries({ queryKey: ['controlPoint', siteId, pointId] })
      toast.success('Kontrollpunkt erfolgreich aktualisiert')
      navigate(`/sites/${siteId}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren des Kontrollpunkts')
    },
  })

  // Generate QR Code mutation
  const generateQRMutation = useMutation({
    mutationFn: () => generateQRCode(siteId!, pointId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['controlPoint', siteId, pointId] })
      setFormData((prev) => ({ ...prev, qrCode: data.qrCode || '' }))
      toast.success('QR-Code erfolgreich generiert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Generieren des QR-Codes')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name ist erforderlich')
      return
    }
    if (!formData.location.trim()) {
      toast.error('Ort ist erforderlich')
      return
    }
    if (!formData.nfcTagId.trim() && !formData.qrCode.trim()) {
      toast.error('Mindestens NFC-Tag-ID oder QR-Code muss angegeben werden')
      return
    }

    if (isEditMode) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  if (isLoading) {
    return <SkeletonForm />
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/sites/${siteId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Zurück
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Kontrollpunkt bearbeiten' : 'Neuer Kontrollpunkt'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {/* Basis-Informationen */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Basis-Informationen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Name *">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Haupteingang Nord"
                required
              />
            </FormField>

            <FormField label="Reihenfolge">
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                required
              />
            </FormField>
          </div>

          <FormField label="Ort / Beschreibung *">
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="z.B. Haupteingang, Erdgeschoss"
              required
            />
          </FormField>

          <FormField label="Anweisungen (optional)">
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="z.B. Überprüfen Sie alle Türen und Fenster..."
              rows={3}
            />
          </FormField>
        </div>

        {/* NFC & QR-Code */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Smartphone size={20} className="text-green-600" />
            NFC & QR-Code
          </h2>
          <p className="text-sm text-gray-600">
            Mindestens ein Scanverfahren (NFC oder QR) muss angegeben werden.
          </p>

          <FormField label="NFC-Tag-ID">
            <div className="flex gap-2">
              <Input
                value={formData.nfcTagId}
                onChange={(e) => setFormData({ ...formData, nfcTagId: e.target.value })}
                placeholder="z.B. 04:A1:B2:C3:D4:E5:F6"
              />
              <Smartphone size={20} className="text-green-600 mt-2" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Die eindeutige ID des NFC-Tags (wird beim ersten Scan automatisch erkannt)
            </p>
          </FormField>

          <FormField label="QR-Code">
            <div className="flex gap-2">
              <Input
                value={formData.qrCode}
                onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                placeholder="Wird automatisch generiert oder manuell eingeben"
                disabled={isEditMode && !!existingPoint?.qrCode}
              />
              {isEditMode && !existingPoint?.qrCode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateQRMutation.mutate()}
                  disabled={generateQRMutation.isPending}
                >
                  {generateQRMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <QrCode size={16} />
                  )}
                </Button>
              )}
            </div>
            {existingPoint?.qrCode && (
              <p className="text-xs text-green-600 mt-1">
                QR-Code bereits vorhanden: {existingPoint.qrCode}
              </p>
            )}
          </FormField>
        </div>

        {/* GPS-Koordinaten (optional) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">GPS-Koordinaten (optional)</h2>
          <p className="text-sm text-gray-600">
            Für GPS-Verifikation (100m Toleranz). Kann leer gelassen werden.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Breitengrad (Latitude)">
              <Input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="z.B. 50.123456"
              />
            </FormField>

            <FormField label="Längengrad (Longitude)">
              <Input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="z.B. 8.654321"
              />
            </FormField>
          </div>
        </div>

        {/* Status (nur Edit Mode) */}
        {isEditMode && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Status</h2>
            <FormField label="Aktiv">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Kontrollpunkt ist aktiv und kann gescannt werden</span>
              </label>
            </FormField>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate(`/sites/${siteId}`)}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
            {isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {isEditMode ? 'Wird gespeichert...' : 'Wird angelegt...'}
              </>
            ) : isEditMode ? (
              'Speichern'
            ) : (
              'Anlegen'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
