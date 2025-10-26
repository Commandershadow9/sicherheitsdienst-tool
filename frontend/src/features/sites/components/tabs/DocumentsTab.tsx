import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form'
import { FileText, Upload, Download, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { toastSuccess, toastError } from '@/lib/toast-helpers'
import { api } from '@/lib/api'
import DocumentViewerModal from '../DocumentViewerModal'

type DocumentData = {
  id: string
  title: string
  description?: string
  category: string
  filename: string
  fileSize: number
  mimeType: string
  version: number
  isLatest: boolean
  uploadedAt: string
  uploader: { id: string; firstName: string; lastName: string }
}

type Site = {
  id: string
  name: string
  documents?: DocumentData[]
}

type DocumentsTabProps = {
  site: Site
  siteId: string
}

export default function DocumentsTab({ site, siteId }: DocumentsTabProps) {
  const queryClient = useQueryClient()
  const [uploadDocumentModal, setUploadDocumentModal] = useState<{
    title: string
    description: string
    category: string
    file: File | null
  } | null>(null)
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null)
  const [viewDocument, setViewDocument] = useState<{
    id: string
    title: string
    filename: string
    mimeType: string
    fileSize: number
  } | null>(null)

  // Upload Document Mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string; file: File }) => {
      const formData = new FormData()
      formData.append('document', data.file)
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      const res = await api.post(`/sites/${siteId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.documentUploaded(variables.title, variables.category)
      setUploadDocumentModal(null)
    },
    onError: (error: any) => {
      toastError.uploadFailed('Dokument', error?.response?.data?.message)
    },
  })

  // Delete Document Mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/sites/${siteId}/documents/${documentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.generic('Dokument gelöscht', 'Das Dokument wurde erfolgreich entfernt')
      setDeleteDocumentId(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Löschen', error?.response?.data?.message)
    },
  })

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" />
            Dokumente ({site.documents?.length || 0})
          </h3>
          <Button
            size="sm"
            onClick={() =>
              setUploadDocumentModal({ title: '', description: '', category: 'DIENSTANWEISUNG', file: null })
            }
          >
            <Upload size={16} className="mr-2" />
            Dokument hochladen
          </Button>
        </div>
        {!site.documents || site.documents.length === 0 ? (
          <p className="text-gray-500">Keine Dokumente vorhanden</p>
        ) : (
          <div className="space-y-3">
            {site.documents.map((document) => (
              <div
                key={document.id}
                className="border rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={18} className="text-indigo-600" />
                      <h4 className="font-semibold">{document.title}</h4>
                      {document.version > 1 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          v{document.version}
                        </span>
                      )}
                      {document.isLatest && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Aktuell</span>
                      )}
                    </div>
                    {document.description && <p className="text-sm text-gray-600 mb-2">{document.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Kategorie:</span> {document.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Datei:</span> {document.filename}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Größe:</span> {(document.fileSize / 1024).toFixed(2)} KB
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Hochgeladen:</span>{' '}
                        {new Date(document.uploadedAt).toLocaleDateString('de-DE')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Von:</span> {document.uploader.firstName}{' '}
                        {document.uploader.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setViewDocument({
                          id: document.id,
                          title: document.title,
                          filename: document.filename,
                          mimeType: document.mimeType,
                          fileSize: document.fileSize,
                        })
                      }
                    >
                      <Eye size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`/api/sites/${siteId}/documents/${document.id}/download`, '_blank')}>
                      <Download size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteDocumentId(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dokument hochladen Modal */}
      {uploadDocumentModal && (
        <Modal
          title="Dokument hochladen"
          open={!!uploadDocumentModal}
          onClose={() => setUploadDocumentModal(null)}
        >
          <div className="space-y-4">
            <FormField label="Titel *">
              <Input
                value={uploadDocumentModal.title}
                onChange={(e) => setUploadDocumentModal({ ...uploadDocumentModal, title: e.target.value })}
                placeholder="z.B. Dienstanweisung Zutrittskontrolle"
              />
            </FormField>
            <FormField label="Beschreibung">
              <Textarea
                value={uploadDocumentModal.description}
                onChange={(e) => setUploadDocumentModal({ ...uploadDocumentModal, description: e.target.value })}
                placeholder="Optionale Beschreibung des Dokuments..."
                rows={3}
              />
            </FormField>
            <FormField label="Kategorie *">
              <Select
                value={uploadDocumentModal.category}
                onChange={(e: any) => setUploadDocumentModal({ ...uploadDocumentModal, category: e.target.value })}
              >
                <option value="DIENSTANWEISUNG">Dienstanweisung</option>
                <option value="NOTFALLPLAN">Notfallplan</option>
                <option value="VERTRAG">Vertrag</option>
                <option value="BRANDSCHUTZORDNUNG">Brandschutzordnung</option>
                <option value="HAUSORDNUNG">Hausordnung</option>
                <option value="GRUNDRISS">Grundriss</option>
                <option value="SONSTIGES">Sonstiges</option>
              </Select>
            </FormField>
            <FormField label="Datei *">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadDocumentModal({ ...uploadDocumentModal, file })
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unterstützt: PDF, Word, Text, Markdown (max. 10MB)
              </p>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setUploadDocumentModal(null)}
                disabled={uploadDocumentMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!uploadDocumentModal.title || !uploadDocumentModal.file) {
                    toast.error('Bitte Titel und Datei auswählen')
                    return
                  }
                  uploadDocumentMutation.mutate({
                    title: uploadDocumentModal.title,
                    description: uploadDocumentModal.description,
                    category: uploadDocumentModal.category,
                    file: uploadDocumentModal.file,
                  })
                }}
                loading={uploadDocumentMutation.isPending}
                loadingText="Wird hochgeladen..."
              >
                Hochladen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dokument löschen Bestätigung */}
      {deleteDocumentId && (
        <Modal title="Dokument löschen" open={!!deleteDocumentId} onClose={() => setDeleteDocumentId(null)}>
          <div className="space-y-4">
            <p className="text-red-600">
              Möchten Sie dieses Dokument wirklich löschen?
            </p>
            <p className="text-sm text-gray-600">
              Hinweis: Falls eine ältere Version existiert, wird diese automatisch als "aktuell" markiert.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDocumentId(null)}
                disabled={deleteDocumentMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteDocumentMutation.mutate(deleteDocumentId)}
                disabled={deleteDocumentMutation.isPending}
              >
                {deleteDocumentMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dokument-Viewer */}
      {viewDocument && (
        <DocumentViewerModal siteId={siteId} document={viewDocument} onClose={() => setViewDocument(null)} />
      )}
    </>
  )
}
