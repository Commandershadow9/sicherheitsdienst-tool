import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Plus, Trash2, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

type IncidentData = {
  id: string
  title: string
  description?: string
  category: string
  severity: string
  status: string
  occurredAt: string
  reportedAt: string
  location?: string
  involvedPersons?: string
  resolvedAt?: string
  resolution?: string
  reporter: { id: string; firstName: string; lastName: string }
}

type Site = {
  id: string
  name: string
  incidents?: IncidentData[]
}

type IncidentsTabProps = {
  site: Site
  siteId: string
}

export default function IncidentsTab({ site, siteId }: IncidentsTabProps) {
  const queryClient = useQueryClient()
  const [incidentFilters, setIncidentFilters] = useState<{
    status: string
    severity: string
    category: string
  }>({ status: 'ALL', severity: 'ALL', category: 'ALL' })

  const [createIncidentModal, setCreateIncidentModal] = useState<{
    title: string
    description: string
    category: string
    severity: string
    occurredAt: string
    location: string
    involvedPersons: Array<{ name: string; role?: string; isWitness?: boolean }>
  } | null>(null)

  const [deleteIncidentId, setDeleteIncidentId] = useState<string | null>(null)
  const [resolveIncident, setResolveIncident] = useState<{ id: string; title: string; resolution?: string } | null>(null)

  // Create Incident Mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (data: {
      title: string
      description: string
      category: string
      severity: string
      occurredAt: string
      location?: string
      involvedPersons?: string
    }) => {
      const res = await api.post(`/sites/${siteId}/incidents`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall erfolgreich gemeldet')
      setCreateIncidentModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Melden des Vorfalls')
    },
  })

  // Resolve Incident Mutation
  const resolveIncidentMutation = useMutation({
    mutationFn: async ({ incidentId, resolution }: { incidentId: string; resolution: string }) => {
      const res = await api.put(`/sites/${siteId}/incidents/${incidentId}/resolve`, { resolution })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall als gelöst markiert')
      setResolveIncident(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Auflösen des Vorfalls')
    },
  })

  // Delete Incident Mutation
  const deleteIncidentMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      await api.delete(`/sites/${siteId}/incidents/${incidentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall erfolgreich gelöscht')
      setDeleteIncidentId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen des Vorfalls')
    },
  })

  const filteredIncidents = site.incidents?.filter((inc: any) => {
    if (incidentFilters.status !== 'ALL' && inc.status !== incidentFilters.status) return false
    if (incidentFilters.severity !== 'ALL' && inc.severity !== incidentFilters.severity) return false
    if (incidentFilters.category !== 'ALL' && inc.category !== incidentFilters.category) return false
    return true
  }) || []

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-600" />
            Vorfälle ({filteredIncidents.length} / {site.incidents?.length || 0})
          </h3>
          <Button
            size="sm"
            onClick={() =>
              setCreateIncidentModal({
                title: '',
                description: '',
                category: 'OTHER',
                severity: 'MEDIUM',
                occurredAt: new Date().toISOString().slice(0, 16),
                location: '',
                involvedPersons: [],
              })
            }
          >
            <Plus size={16} className="mr-2" />
            Vorfall melden
          </Button>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-lg"
              value={incidentFilters.status}
              onChange={(e) => setIncidentFilters({ ...incidentFilters, status: e.target.value })}
            >
              <option value="ALL">Alle Status</option>
              <option value="OPEN">Offen</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="RESOLVED">Gelöst</option>
              <option value="CLOSED">Geschlossen</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Schweregrad</label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-lg"
              value={incidentFilters.severity}
              onChange={(e) => setIncidentFilters({ ...incidentFilters, severity: e.target.value })}
            >
              <option value="ALL">Alle</option>
              <option value="CRITICAL">Kritisch</option>
              <option value="HIGH">Hoch</option>
              <option value="MEDIUM">Mittel</option>
              <option value="LOW">Niedrig</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-lg"
              value={incidentFilters.category}
              onChange={(e) => setIncidentFilters({ ...incidentFilters, category: e.target.value })}
            >
              <option value="ALL">Alle</option>
              <option value="FIRE">Brand</option>
              <option value="BREAK_IN">Einbruch</option>
              <option value="THEFT">Diebstahl</option>
              <option value="VANDALISM">Vandalismus</option>
              <option value="ACCIDENT">Unfall</option>
              <option value="MEDICAL_EMERGENCY">Medizinischer Notfall</option>
              <option value="DISTURBANCE">Ruhestörung</option>
              <option value="PROPERTY_DAMAGE">Sachbeschädigung</option>
              <option value="SUSPICIOUS_PERSON">Verdächtige Person</option>
              <option value="TECHNICAL_FAILURE">Technischer Ausfall</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>
        </div>

        {!site.incidents || site.incidents.length === 0 ? (
          <p className="text-gray-500">Keine Vorfälle gemeldet</p>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="border-l-4 border-l-orange-500 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={18} className="text-orange-600" />
                      <h4 className="font-semibold">{incident.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {incident.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        incident.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        incident.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                    {incident.description && <p className="text-sm text-gray-600 mb-2">{incident.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Kategorie:</span> {incident.category}
                      </span>
                      {incident.location && (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Ort:</span> {incident.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Vorfallzeit:</span>{' '}
                        {new Date(incident.occurredAt).toLocaleString('de-DE')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Gemeldet von:</span> {incident.reporter.firstName}{' '}
                        {incident.reporter.lastName}
                      </span>
                    </div>
                    {incident.resolution && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <span className="font-medium text-green-800">Lösung:</span> {incident.resolution}
                      </div>
                    )}
                    {incident.involvedPersons && (() => {
                      try {
                        const persons = JSON.parse(incident.involvedPersons)
                        if (persons.length > 0) {
                          return (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium text-gray-800">Beteiligte Personen:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {persons.map((person: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-0.5 bg-white border border-gray-300 rounded text-xs"
                                  >
                                    {person.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        }
                      } catch {
                        return null
                      }
                      return null
                    })()}
                  </div>
                  <div className="flex gap-1 ml-4">
                    {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setResolveIncident({ id: incident.id, title: incident.title })}
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Auflösen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteIncidentId(incident.id)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Löschen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vorfall melden Modal */}
      {createIncidentModal && (
        <Modal open={true} onClose={() => setCreateIncidentModal(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall melden</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={createIncidentModal.title}
                onChange={(e) =>
                  setCreateIncidentModal({ ...createIncidentModal, title: e.target.value })
                }
                placeholder="Kurze Beschreibung des Vorfalls"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung *</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                value={createIncidentModal.description}
                onChange={(e) =>
                  setCreateIncidentModal({ ...createIncidentModal, description: e.target.value })
                }
                placeholder="Detaillierte Beschreibung des Vorfalls"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.category}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, category: e.target.value })
                  }
                >
                  <option value="OTHER">Sonstiges</option>
                  <option value="FIRE">Brand</option>
                  <option value="BREAK_IN">Einbruch</option>
                  <option value="THEFT">Diebstahl</option>
                  <option value="VANDALISM">Vandalismus</option>
                  <option value="ACCIDENT">Unfall</option>
                  <option value="MEDICAL_EMERGENCY">Medizinischer Notfall</option>
                  <option value="DISTURBANCE">Ruhestörung</option>
                  <option value="PROPERTY_DAMAGE">Sachbeschädigung</option>
                  <option value="SUSPICIOUS_PERSON">Verdächtige Person</option>
                  <option value="TECHNICAL_FAILURE">Technischer Ausfall</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schweregrad *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.severity}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, severity: e.target.value })
                  }
                >
                  <option value="LOW">Niedrig</option>
                  <option value="MEDIUM">Mittel</option>
                  <option value="HIGH">Hoch</option>
                  <option value="CRITICAL">Kritisch</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorfallzeit *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.occurredAt}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, occurredAt: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.location}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, location: e.target.value })
                  }
                  placeholder="z.B. Gebäude A, Eingang Süd"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Beteiligte Personen</label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreateIncidentModal({
                      ...createIncidentModal,
                      involvedPersons: [...createIncidentModal.involvedPersons, { name: '', role: '', isWitness: false }],
                    })
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Person hinzufügen
                </Button>
              </div>
              {createIncidentModal.involvedPersons.map((person, index) => (
                <div key={index} className="flex gap-2 mb-2 p-2 bg-gray-50 rounded">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded text-sm"
                    placeholder="Name"
                    value={person.name}
                    onChange={(e) => {
                      const updated = [...createIncidentModal.involvedPersons]
                      updated[index] = { ...updated[index], name: e.target.value }
                      setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                    }}
                  />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded text-sm"
                    placeholder="Rolle (optional)"
                    value={person.role || ''}
                    onChange={(e) => {
                      const updated = [...createIncidentModal.involvedPersons]
                      updated[index] = { ...updated[index], role: e.target.value }
                      setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const updated = createIncidentModal.involvedPersons.filter((_, i) => i !== index)
                      setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateIncidentModal(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  if (!createIncidentModal.title || !createIncidentModal.description) {
                    toast.error('Titel und Beschreibung sind erforderlich')
                    return
                  }
                  createIncidentMutation.mutate({
                    title: createIncidentModal.title,
                    description: createIncidentModal.description,
                    category: createIncidentModal.category,
                    severity: createIncidentModal.severity,
                    occurredAt: createIncidentModal.occurredAt,
                    location: createIncidentModal.location || undefined,
                    involvedPersons:
                      createIncidentModal.involvedPersons.length > 0
                        ? JSON.stringify(createIncidentModal.involvedPersons)
                        : undefined,
                  })
                }}
                disabled={createIncidentMutation.isPending}
              >
                {createIncidentMutation.isPending ? 'Wird gemeldet...' : 'Vorfall melden'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vorfall löschen Bestätigung */}
      {deleteIncidentId && (
        <Modal open={true} onClose={() => setDeleteIncidentId(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall löschen?</h2>
            <p className="text-gray-600">
              Möchten Sie diesen Vorfall wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteIncidentId(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteIncidentMutation.mutate(deleteIncidentId)}
                disabled={deleteIncidentMutation.isPending}
              >
                {deleteIncidentMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vorfall auflösen Modal */}
      {resolveIncident && (
        <Modal open={true} onClose={() => setResolveIncident(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall auflösen</h2>
            <p className="text-gray-600">
              Vorfall: <strong>{resolveIncident.title}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auflösungs-Beschreibung *</label>
              <Textarea
                rows={4}
                placeholder="Beschreiben Sie, wie der Vorfall gelöst wurde..."
                value={resolveIncident.resolution || ''}
                onChange={(e) =>
                  setResolveIncident({ ...resolveIncident, resolution: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setResolveIncident(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const resolution = resolveIncident.resolution
                  if (!resolution || resolution.trim() === '') {
                    toast.error('Bitte geben Sie eine Auflösungs-Beschreibung ein')
                    return
                  }
                  resolveIncidentMutation.mutate({
                    incidentId: resolveIncident.id,
                    resolution,
                  })
                }}
                disabled={resolveIncidentMutation.isPending}
              >
                {resolveIncidentMutation.isPending ? 'Wird aufgelöst...' : 'Vorfall auflösen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
