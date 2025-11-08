import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'

interface UploadImageModalProps {
  open: boolean
  onClose: () => void
  onUpload: (file: File, category: string) => void
  isPending?: boolean
}

export function UploadImageModal({
  open,
  onClose,
  onUpload,
  isPending = false,
}: UploadImageModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('ALLGEMEIN')

  const handleUpload = () => {
    if (!file) {
      toast.error('Bitte wählen Sie eine Datei aus')
      return
    }
    onUpload(file, category)
  }

  return (
    <Modal title="Bild hochladen" open={open} onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Kategorie">
          <Select value={category} onChange={(e: any) => setCategory(e.target.value)}>
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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Abbrechen
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file}
            loading={isPending}
            loadingText="Wird hochgeladen..."
          >
            Hochladen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
