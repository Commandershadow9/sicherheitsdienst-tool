import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { UserSelect } from '@/components/ui/user-select'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { toastSuccess, toastError } from '@/lib/toast-helpers'
import { completeClearanceTraining, revokeClearance, type Clearance } from '../../api'
import { api } from '@/lib/api'

type ClearanceData = {
  id: string
  status: string
  user: { id: string; firstName: string; lastName: string }
  trainingCompletedAt?: string
}

type Site = {
  id: string
  name: string
  clearances?: ClearanceData[]
}

type ClearancesTabProps = {
  site: Site
  siteId: string
}

export default function ClearancesTab({ site, siteId }: ClearancesTabProps) {
  const queryClient = useQueryClient()
  const [trainingModal, setTrainingModal] = useState<{ clearance: Clearance; hours: number } | null>(null)
  const [revokeModal, setRevokeModal] = useState<{ clearance: Clearance; notes: string } | null>(null)
  const [createClearanceModal, setCreateClearanceModal] = useState<{ userId: string; notes: string } | null>(null)

  // Fetch users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users?pageSize=1000')
      return res.data
    },
    enabled: !!createClearanceModal,
  })

  // Complete Training Mutation
  const completeTrainingMutation = useMutation({
    mutationFn: (data: { id: string; hours: number }) => completeClearanceTraining(data.id, { trainingHours: data.hours }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      if (trainingModal && site) {
        const userName = `${trainingModal.clearance.user.firstName} ${trainingModal.clearance.user.lastName}`
        toastSuccess.clearanceCompleted(userName, site.name)
      } else {
        toast.success('Training erfolgreich abgeschlossen')
      }
      setTrainingModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Abschließen des Trainings', error?.response?.data?.message)
    },
  })

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: (data: { id: string; notes: string }) => revokeClearance(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      if (revokeModal && site) {
        const userName = `${revokeModal.clearance.user.firstName} ${revokeModal.clearance.user.lastName}`
        toastSuccess.clearanceRevoked(userName, site.name)
      } else {
        toast.success('Clearance erfolgreich widerrufen')
      }
      setRevokeModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Widerrufen', error?.response?.data?.message)
    },
  })

  // Create Clearance Mutation
  const createClearanceMutation = useMutation({
    mutationFn: async (data: { userId: string; notes: string }) => {
      const res = await api.post('/clearances', {
        userId: data.userId,
        siteId: siteId,
        status: 'TRAINING',
        notes: data.notes,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Clearance erfolgreich angelegt')
      setCreateClearanceModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Anlegen der Clearance', error?.response?.data?.message)
    },
  })

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield size={20} className="text-green-600" />
            Clearances ({site.clearances?.length || 0})
          </h3>
          <Button size="sm" onClick={() => setCreateClearanceModal({ userId: '', notes: '' })}>
            Neue Clearance
          </Button>
        </div>
        {!site.clearances || site.clearances.length === 0 ? (
          <p className="text-gray-500">Keine Clearances vorhanden</p>
        ) : (
          <div className="space-y-2">
            {site.clearances.map((clearance) => (
              <div key={clearance.id} className="border rounded p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {clearance.user.firstName} {clearance.user.lastName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          clearance.status === 'ACTIVE' && 'bg-green-100 text-green-800',
                          clearance.status === 'TRAINING' && 'bg-yellow-100 text-yellow-800',
                          clearance.status === 'EXPIRED' && 'bg-gray-100 text-gray-800',
                          clearance.status === 'REVOKED' && 'bg-red-100 text-red-800'
                        )}
                      >
                        {clearance.status}
                      </span>
                    </div>
                    {clearance.trainingCompletedAt && (
                      <div className="text-sm text-gray-600 mt-1">
                        Training abgeschlossen: {new Date(clearance.trainingCompletedAt).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {clearance.status === 'TRAINING' && (
                      <Button
                        size="sm"
                        onClick={() => setTrainingModal({ clearance: clearance as any, hours: 0 })}
                      >
                        Training abschließen
                      </Button>
                    )}
                    {clearance.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRevokeModal({ clearance: clearance as any, notes: '' })}
                      >
                        Widerrufen
                      </Button>
                    )}
                    <Link to={`/users/${clearance.user.id}/profile`} className="text-blue-600 hover:underline text-sm self-center">
                      Profil →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training abschließen Modal */}
      {trainingModal && (
        <Modal
          title="Training abschließen"
          open={!!trainingModal}
          onClose={() => setTrainingModal(null)}
        >
          <div className="space-y-4">
            <p>
              Training für <strong>{trainingModal.clearance.user.firstName} {trainingModal.clearance.user.lastName}</strong> abschließen?
            </p>
            <FormField label="Anzahl Trainingsstunden">
              <Input
                type="number"
                min="0"
                value={trainingModal.hours}
                onChange={(e) => setTrainingModal({ ...trainingModal, hours: parseInt(e.target.value) || 0 })}
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTrainingModal(null)}>
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  completeTrainingMutation.mutate({ id: trainingModal.clearance.id, hours: trainingModal.hours })
                }
                loading={completeTrainingMutation.isPending}
                loadingText="Wird gespeichert..."
              >
                Abschließen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Widerrufen Modal */}
      {revokeModal && (
        <Modal
          title="Clearance widerrufen"
          open={!!revokeModal}
          onClose={() => setRevokeModal(null)}
        >
          <div className="space-y-4">
            <p className="text-red-600">
              Clearance für <strong>{revokeModal.clearance.user.firstName} {revokeModal.clearance.user.lastName}</strong> widerrufen?
            </p>
            <FormField label="Grund (optional)">
              <Textarea
                value={revokeModal.notes}
                onChange={(e) => setRevokeModal({ ...revokeModal, notes: e.target.value })}
                placeholder="Geben Sie einen Grund an..."
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRevokeModal(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() =>
                  revokeMutation.mutate({ id: revokeModal.clearance.id, notes: revokeModal.notes })
                }
                loading={revokeMutation.isPending}
                loadingText="Wird widerrufen..."
              >
                Widerrufen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Neue Clearance anlegen */}
      {createClearanceModal && (
        <Modal title="Neue Clearance anlegen" open={!!createClearanceModal} onClose={() => setCreateClearanceModal(null)}>
          <div className="space-y-4">
            <FormField label="Mitarbeiter auswählen *">
              <UserSelect
                users={usersData?.data || []}
                value={createClearanceModal.userId}
                onChange={(userId) => setCreateClearanceModal({ ...createClearanceModal, userId })}
                placeholder="Suche nach Name oder Email..."
              />
            </FormField>
            <FormField label="Notizen (optional)">
              <Textarea
                value={createClearanceModal.notes}
                onChange={(e) => setCreateClearanceModal({ ...createClearanceModal, notes: e.target.value })}
                placeholder="Zusätzliche Informationen zur Clearance..."
                rows={3}
              />
            </FormField>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                💡 <strong>Hinweis:</strong> Die Clearance wird mit Status <strong>TRAINING</strong> angelegt. Nach Abschluss des Trainings kann der Status auf ACTIVE gesetzt werden.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreateClearanceModal(null)}
                disabled={createClearanceMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!createClearanceModal.userId) {
                    toast.error('Bitte wählen Sie einen Mitarbeiter aus')
                    return
                  }
                  // Check if clearance already exists
                  const exists = site.clearances?.some((c) => c.user.id === createClearanceModal.userId)
                  if (exists) {
                    toast.error('Dieser Mitarbeiter hat bereits eine Clearance für dieses Objekt')
                    return
                  }
                  createClearanceMutation.mutate({
                    userId: createClearanceModal.userId,
                    notes: createClearanceModal.notes,
                  })
                }}
                disabled={createClearanceMutation.isPending || !createClearanceModal.userId}
              >
                {createClearanceMutation.isPending ? 'Wird angelegt...' : 'Clearance anlegen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
