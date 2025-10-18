import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { SkeletonForm } from '@/components/ui/skeleton'

type SiteFormProps = {
  mode: 'create' | 'edit'
}

type SiteFormData = {
  name: string
  address: string
  city: string
  postalCode: string
  status: 'INQUIRY' | 'IN_REVIEW' | 'CALCULATING' | 'OFFER_SENT' | 'ACTIVE' | 'INACTIVE' | 'LOST'
  customerName?: string
  customerCompany?: string
  customerEmail?: string
  customerPhone?: string
  requiredStaff: number
  requiredQualifications: string[]
  description?: string
  notes?: string
  emergencyContacts: Array<{ name: string; phone: string; role?: string }>
}

const STATUS_OPTIONS = [
  { value: 'INQUIRY', label: 'Anfrage' },
  { value: 'IN_REVIEW', label: 'In Prüfung' },
  { value: 'CALCULATING', label: 'Kalkulation' },
  { value: 'OFFER_SENT', label: 'Angebot versendet' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'INACTIVE', label: 'Inaktiv' },
  { value: 'LOST', label: 'Verloren' },
]

const INITIAL_FORM_DATA: SiteFormData = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  status: 'INQUIRY',
  customerName: '',
  customerCompany: '',
  customerEmail: '',
  customerPhone: '',
  requiredStaff: 1,
  requiredQualifications: [],
  description: '',
  notes: '',
  emergencyContacts: [],
}

export default function SiteForm({ mode }: SiteFormProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<SiteFormData>(INITIAL_FORM_DATA)
  const [newQualification, setNewQualification] = useState('')

  // Fetch existing site for edit mode
  const { data: existingSite, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      if (!id) return null
      const res = await api.get(`/sites/${id}`)
      return res.data.data
    },
    enabled: mode === 'edit' && !!id,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingSite) {
      setFormData({
        name: existingSite.name || '',
        address: existingSite.address || '',
        city: existingSite.city || '',
        postalCode: existingSite.postalCode || '',
        status: existingSite.status || 'ACTIVE',
        customerName: existingSite.customerName || '',
        customerCompany: existingSite.customerCompany || '',
        customerEmail: existingSite.customerEmail || '',
        customerPhone: existingSite.customerPhone || '',
        requiredStaff: existingSite.requiredStaff || 1,
        requiredQualifications: existingSite.requiredQualifications || [],
        description: existingSite.description || '',
        notes: existingSite.notes || '',
        emergencyContacts: existingSite.emergencyContacts || [],
      })
    }
  }, [existingSite])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      const res = await api.post('/sites', data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Objekt erfolgreich erstellt')
      navigate(`/sites/${data.data.id}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      const res = await api.put(`/sites/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Objekt erfolgreich aktualisiert')
      navigate(`/sites/${id}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'create') {
      createMutation.mutate(formData)
    } else {
      updateMutation.mutate(formData)
    }
  }

  const addQualification = () => {
    if (newQualification.trim() && !formData.requiredQualifications.includes(newQualification.trim())) {
      setFormData((prev) => ({
        ...prev,
        requiredQualifications: [...prev.requiredQualifications, newQualification.trim()],
      }))
      setNewQualification('')
    }
  }

  const removeQualification = (qual: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredQualifications: prev.requiredQualifications.filter((q) => q !== qual),
    }))
  }

  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', phone: '', role: '' }],
    }))
  }

  const updateEmergencyContact = (index: number, field: 'name' | 'phone' | 'role', value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }))
  }

  const removeEmergencyContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
    }))
  }

  if (mode === 'edit' && isLoading) {
    return <SkeletonForm />
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="link" onClick={() => navigate('/sites')} className="px-0 mb-2">
            ← Zurück zur Liste
          </Button>
          <h1 className="text-2xl font-bold">{mode === 'create' ? 'Neues Objekt anlegen' : 'Objekt bearbeiten'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basis-Informationen */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basis-Informationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Objekt-Name *">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Bürogebäude Zentrum"
                required
              />
            </FormField>
            <FormField label="Status *">
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Adresse *">
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Straße und Hausnummer"
              required
            />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="PLZ *">
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="12345"
                required
              />
            </FormField>
            <FormField label="Stadt *" className="col-span-2">
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Berlin"
                required
              />
            </FormField>
          </div>

          <FormField label="Beschreibung">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Zusätzliche Informationen zum Objekt..."
              rows={3}
            />
          </FormField>
        </div>

        {/* Kunden-Informationen */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Kunden-Informationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Ansprechpartner">
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Max Mustermann"
              />
            </FormField>
            <FormField label="Firma">
              <Input
                value={formData.customerCompany}
                onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                placeholder="Mustermann GmbH"
              />
            </FormField>
            <FormField label="E-Mail">
              <Input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="kontakt@mustermann.de"
              />
            </FormField>
            <FormField label="Telefon">
              <Input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </FormField>
          </div>
        </div>

        {/* Anforderungen */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Anforderungen</h2>
          <FormField label="Benötigte Mitarbeiter *">
            <Input
              type="number"
              min="1"
              value={formData.requiredStaff}
              onChange={(e) => setFormData({ ...formData, requiredStaff: parseInt(e.target.value) || 1 })}
              required
            />
          </FormField>

          <FormField label="Erforderliche Qualifikationen">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  placeholder="z.B. NSL, BRANDSCHUTZ"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <Button type="button" onClick={addQualification} size="sm">
                  <Plus size={16} /> Hinzufügen
                </Button>
              </div>
              {formData.requiredQualifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requiredQualifications.map((qual) => (
                    <span
                      key={qual}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {qual}
                      <button type="button" onClick={() => removeQualification(qual)} className="hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Notfallkontakte */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Notfallkontakte</h2>
            <Button type="button" onClick={addEmergencyContact} size="sm" variant="outline">
              <Plus size={16} /> Kontakt hinzufügen
            </Button>
          </div>
          {formData.emergencyContacts.length === 0 && (
            <p className="text-sm text-gray-500">Keine Notfallkontakte hinzugefügt</p>
          )}
          {formData.emergencyContacts.map((contact, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded">
              <FormField label="Name">
                <Input
                  value={contact.name}
                  onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                  placeholder="Name"
                />
              </FormField>
              <FormField label="Telefon">
                <Input
                  value={contact.phone}
                  onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                  placeholder="+49 123 456789"
                />
              </FormField>
              <FormField label="Rolle">
                <Input
                  value={contact.role || ''}
                  onChange={(e) => updateEmergencyContact(index, 'role', e.target.value)}
                  placeholder="z.B. Hausmeister"
                />
              </FormField>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeEmergencyContact(index)}
                  className="w-full"
                >
                  <Trash2 size={16} /> Entfernen
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Notizen */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Interne Notizen</h2>
          <FormField label="Notizen (nur intern sichtbar)">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Interne Bemerkungen, die nicht für den Kunden sichtbar sind..."
              rows={4}
            />
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/sites')} disabled={isPending}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Wird gespeichert...' : mode === 'create' ? 'Objekt anlegen' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>
    </div>
  )
}
