import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form'
import { Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { toastSuccess, toastError } from '@/lib/toast-helpers'
import { api } from '@/lib/api'

type ImageData = {
  id: string
  filename: string
  category: string
  uploadedAt: string
  uploader: { firstName: string; lastName: string }
}

type Site = {
  id: string
  name: string
  images?: ImageData[]
}

type ImagesTabProps = {
  site: Site
  siteId: string
}

export default function ImagesTab({ site, siteId }: ImagesTabProps) {
  const queryClient = useQueryClient()
  const [uploadModal, setUploadModal] = useState<{ file: File | null; category: string } | null>(null)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)

  // Upload Image Mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (data: { file: File; category: string }) => {
      const formData = new FormData()
      formData.append('image', data.file)
      formData.append('category', data.category)
      const res = await api.post(`/sites/${siteId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.imageUploaded(variables.category)
      setUploadModal(null)
    },
    onError: (error: any) => {
      toastError.uploadFailed('Bild', error?.response?.data?.message)
    },
  })

  // Delete Image Mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/sites/${siteId}/images/${imageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.imageDeleted()
      setDeleteImageId(null)
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
            <ImageIcon size={20} className="text-purple-600" />
            Bilder ({site.images?.length || 0})
          </h3>
          <Button size="sm" onClick={() => setUploadModal({ file: null, category: 'ALLGEMEIN' })}>
            Bild hochladen
          </Button>
        </div>
        {!site.images || site.images.length === 0 ? (
          <p className="text-gray-500">Keine Bilder vorhanden</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {site.images.map((image) => (
              <div key={image.id} className="border rounded p-2 relative group hover:shadow-lg transition-all duration-200">
                <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">📷</span>
                </div>
                <p className="text-sm font-medium truncate">{image.filename}</p>
                <p className="text-xs text-gray-600">{image.category}</p>
                <p className="text-xs text-gray-500">
                  {image.uploader.firstName} {image.uploader.lastName}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteImageId(image.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white"
                >
                  Löschen
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bild hochladen Modal */}
      {uploadModal && (
        <Modal title="Bild hochladen" open={!!uploadModal} onClose={() => setUploadModal(null)}>
          <div className="space-y-4">
            <FormField label="Kategorie">
              <Select
                value={uploadModal.category}
                onChange={(e: any) => setUploadModal({ ...uploadModal, category: e.target.value })}
              >
                <option value="ALLGEMEIN">Allgemein</option>
                <option value="AUSSEN">Außenansicht</option>
                <option value="INNEN">Innenansicht</option>
                <option value="ZUGANG">Zugang</option>
                <option value="NOTAUSGANG">Notausgang</option>
                <option value="SONSTIGES">Sonstiges</option>
              </Select>
            </FormField>
            <FormField label="Datei auswählen *">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadModal({ ...uploadModal, file })
                }}
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadModal(null)} disabled={uploadImageMutation.isPending}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (uploadModal.file) {
                    uploadImageMutation.mutate({ file: uploadModal.file, category: uploadModal.category })
                  } else {
                    toast.error('Bitte wählen Sie eine Datei aus')
                  }
                }}
                disabled={!uploadModal.file}
                loading={uploadImageMutation.isPending}
                loadingText="Wird hochgeladen..."
              >
                Hochladen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bild löschen Bestätigung */}
      {deleteImageId && (
        <Modal title="Bild löschen" open={!!deleteImageId} onClose={() => setDeleteImageId(null)}>
          <div className="space-y-4">
            <p className="text-red-600">Möchten Sie dieses Bild wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteImageId(null)} disabled={deleteImageMutation.isPending}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteImageMutation.mutate(deleteImageId)}
                loading={deleteImageMutation.isPending}
                loadingText="Wird gelöscht..."
              >
                Löschen
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
