import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  DollarSign,
  Save
} from 'lucide-react'
import {
  createSiteCalculation,
  updateSiteCalculation,
  fetchSiteCalculation,
  type CalculationFormData
} from '../calculationApi'

type Step = 1 | 2 | 3 | 4

export default function CalculationForm() {
  const { siteId, calculationId } = useParams<{ siteId: string; calculationId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditMode = calculationId !== 'new'
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSaving, setIsSaving] = useState(false)

  // Load existing calculation if editing
  const { data: existingCalculation } = useQuery({
    queryKey: ['calculation', siteId, calculationId],
    queryFn: () => fetchSiteCalculation(siteId!, calculationId!),
    enabled: isEditMode && !!siteId && !!calculationId,
  })

  // Form state
  const [formData, setFormData] = useState<Partial<CalculationFormData>>({
    // Schritt 1: Zeitverteilung
    hoursDay: existingCalculation?.hoursDay || 40,
    hoursNight: existingCalculation?.hoursNight || 0,
    hoursSaturday: existingCalculation?.hoursSaturday || 0,
    hoursSunday: existingCalculation?.hoursSunday || 0,
    hoursHoliday: existingCalculation?.hoursHoliday || 0,

    // Schritt 2: Stundensätze (custom)
    customHourlyRateEmployee: existingCalculation?.customHourlyRateEmployee,
    customHourlyRateShiftLeader: existingCalculation?.customHourlyRateShiftLeader,
    customHourlyRateSiteManager: existingCalculation?.customHourlyRateSiteManager,

    // Schritt 3: Zuschläge (custom)
    customNightSurcharge: existingCalculation?.customNightSurcharge,
    customSaturdaySurcharge: existingCalculation?.customSaturdaySurcharge,
    customSundaySurcharge: existingCalculation?.customSundaySurcharge,
    customHolidaySurcharge: existingCalculation?.customHolidaySurcharge,

    // Schritt 4: Sonstige
    riskSurchargePercentage: existingCalculation?.riskSurchargePercentage || 0,
    distanceSurcharge: existingCalculation?.distanceSurcharge || 0,
    customOverheadPercentage: existingCalculation?.customOverheadPercentage,
    customProfitMarginPercentage: existingCalculation?.customProfitMarginPercentage,
    notes: existingCalculation?.notes || '',
  })

  // Update form when calculation loads
  if (existingCalculation && !formData.hoursDay) {
    setFormData({
      hoursDay: existingCalculation.hoursDay,
      hoursNight: existingCalculation.hoursNight,
      hoursSaturday: existingCalculation.hoursSaturday,
      hoursSunday: existingCalculation.hoursSunday,
      hoursHoliday: existingCalculation.hoursHoliday,
      customHourlyRateEmployee: existingCalculation.customHourlyRateEmployee,
      customHourlyRateShiftLeader: existingCalculation.customHourlyRateShiftLeader,
      customHourlyRateSiteManager: existingCalculation.customHourlyRateSiteManager,
      customNightSurcharge: existingCalculation.customNightSurcharge,
      customSaturdaySurcharge: existingCalculation.customSaturdaySurcharge,
      customSundaySurcharge: existingCalculation.customSundaySurcharge,
      customHolidaySurcharge: existingCalculation.customHolidaySurcharge,
      riskSurchargePercentage: existingCalculation.riskSurchargePercentage,
      distanceSurcharge: existingCalculation.distanceSurcharge,
      customOverheadPercentage: existingCalculation.customOverheadPercentage,
      customProfitMarginPercentage: existingCalculation.customProfitMarginPercentage,
      notes: existingCalculation.notes || '',
    })
  }

  const createMutation = useMutation({
    mutationFn: (data: Partial<CalculationFormData>) => createSiteCalculation(siteId!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Kalkulation erfolgreich erstellt')
      navigate(`/sites/${siteId}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Kalkulation')
      setIsSaving(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CalculationFormData>) =>
      updateSiteCalculation(siteId!, calculationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculation', siteId, calculationId] })
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Kalkulation erfolgreich aktualisiert')
      navigate(`/sites/${siteId}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren der Kalkulation')
      setIsSaving(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (isEditMode) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const updateField = (field: keyof CalculationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const totalHoursPerWeek =
    (formData.hoursDay || 0) +
    (formData.hoursNight || 0) +
    (formData.hoursSaturday || 0) +
    (formData.hoursSunday || 0) +
    (formData.hoursHoliday || 0)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/sites/${siteId}`)}>
          <ArrowLeft size={16} className="mr-2" />
          Zurück zum Auftrag
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calculator size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Kalkulation bearbeiten' : 'Neue Kalkulation erstellen'}
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : currentStep > step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? <CheckCircle size={20} /> : step}
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center">
                  {step === 1 && 'Zeitverteilung'}
                  {step === 2 && 'Stundensätze'}
                  {step === 3 && 'Zuschläge'}
                  {step === 4 && 'Sonstige'}
                </span>
              </div>
              {step < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    currentStep > step ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Schritt 1: Zeitverteilung */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-blue-600" />
                <h2 className="text-xl font-semibold">Schritt 1: Zeitverteilung</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Geben Sie die Arbeitsstunden pro Woche für verschiedene Zeitkategorien ein.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Stunden Tagsüber (Mo-Fr) *">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hoursDay || ''}
                    onChange={(e) => updateField('hoursDay', parseFloat(e.target.value) || 0)}
                    required
                  />
                </FormField>

                <FormField label="Stunden Nachts (Mo-Fr)">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hoursNight || ''}
                    onChange={(e) => updateField('hoursNight', parseFloat(e.target.value) || 0)}
                  />
                </FormField>

                <FormField label="Stunden Samstag">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hoursSaturday || ''}
                    onChange={(e) => updateField('hoursSaturday', parseFloat(e.target.value) || 0)}
                  />
                </FormField>

                <FormField label="Stunden Sonntag">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hoursSunday || ''}
                    onChange={(e) => updateField('hoursSunday', parseFloat(e.target.value) || 0)}
                  />
                </FormField>

                <FormField label="Stunden Feiertag">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hoursHoliday || ''}
                    onChange={(e) => updateField('hoursHoliday', parseFloat(e.target.value) || 0)}
                  />
                </FormField>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    Gesamt: {totalHoursPerWeek.toFixed(1)} Stunden/Woche
                  </span>
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  ≈ {(totalHoursPerWeek * 4.3).toFixed(1)} Stunden/Monat
                </div>
              </div>
            </div>
          )}

          {/* Schritt 2: Stundensätze */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-blue-600" />
                <h2 className="text-xl font-semibold">Schritt 2: Stundensätze (Optional)</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Lassen Sie die Felder leer, um die Standard-Stundensätze zu verwenden, oder geben Sie
                kundenspezifische Werte ein.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Stundensatz Mitarbeiter (€)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Standard: 13.50 €"
                    value={formData.customHourlyRateEmployee || ''}
                    onChange={(e) =>
                      updateField('customHourlyRateEmployee', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>

                <FormField label="Stundensatz Schichtleiter (€)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Standard: 16.00 €"
                    value={formData.customHourlyRateShiftLeader || ''}
                    onChange={(e) =>
                      updateField('customHourlyRateShiftLeader', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>

                <FormField label="Stundensatz Objektleiter (€)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Standard: 18.50 €"
                    value={formData.customHourlyRateSiteManager || ''}
                    onChange={(e) =>
                      updateField('customHourlyRateSiteManager', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Schritt 3: Zuschläge */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-blue-600" />
                <h2 className="text-xl font-semibold">Schritt 3: Zuschläge (Optional)</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Lassen Sie die Felder leer, um die Standard-Zuschläge zu verwenden, oder geben Sie
                kundenspezifische Prozentsätze ein.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nachtzuschlag (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    placeholder="Standard: 25%"
                    value={formData.customNightSurcharge || ''}
                    onChange={(e) =>
                      updateField('customNightSurcharge', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>

                <FormField label="Samstags-Zuschlag (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    placeholder="Standard: 25%"
                    value={formData.customSaturdaySurcharge || ''}
                    onChange={(e) =>
                      updateField('customSaturdaySurcharge', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>

                <FormField label="Sonntags-Zuschlag (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    placeholder="Standard: 50%"
                    value={formData.customSundaySurcharge || ''}
                    onChange={(e) =>
                      updateField('customSundaySurcharge', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>

                <FormField label="Feiertags-Zuschlag (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    placeholder="Standard: 100%"
                    value={formData.customHolidaySurcharge || ''}
                    onChange={(e) =>
                      updateField('customHolidaySurcharge', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Schritt 4: Sonstige */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-blue-600" />
                <h2 className="text-xl font-semibold">Schritt 4: Sonstige Angaben</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Risikozuschlag (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.riskSurchargePercentage || ''}
                    onChange={(e) =>
                      updateField('riskSurchargePercentage', parseFloat(e.target.value) || 0)
                    }
                  />
                </FormField>

                <FormField label="Distanzzuschlag (€/Std.)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.distanceSurcharge || ''}
                    onChange={(e) =>
                      updateField('distanceSurcharge', parseFloat(e.target.value) || 0)
                    }
                  />
                </FormField>

                <FormField label="Gemeinkosten (%)">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Standard: 12%"
                    value={formData.customOverheadPercentage || ''}
                    onChange={(e) =>
                      updateField('customOverheadPercentage', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>

                <FormField label="Gewinnmarge (%)">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Standard: 15%"
                    value={formData.customProfitMarginPercentage || ''}
                    onChange={(e) =>
                      updateField('customProfitMarginPercentage', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormField>
              </div>

              <FormField label="Notizen (Optional)">
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Zusätzliche Anmerkungen zur Kalkulation..."
                />
              </FormField>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  <ArrowLeft size={16} className="mr-2" />
                  Zurück
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Weiter
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>Wird gespeichert...</>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {isEditMode ? 'Aktualisieren' : 'Erstellen'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
