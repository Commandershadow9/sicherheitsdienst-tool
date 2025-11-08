import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'

interface UploadDocumentModalProps {
  open: boolean
  onClose: () => void
  onUpload: (data: {
    title: string
    description: string
    category: string
    file: File
  }) => void
  isPending?: boolean
}

export function UploadDocumentModal({
  open,
  onClose,
  onUpload,
  isPending = false,
}: UploadDocumentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('DIENSTANWEISUNG')
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = () => {
    if (!title || !file) {
      toast.error('Bitte Titel und Datei auswählen')
      return
    }
    onUpload({ title, description, category, file })
  }

  return (
    <Modal title="Dokument hochladen" open={open} onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Titel *">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Dienstanweisung Zutrittskontrolle"
          />
        </FormField>
        <FormField label="Beschreibung">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionale Beschreibung des Dokuments..."
            rows={3}
          />
        </FormField>
        <FormField label="Kategorie *">
          <Select value={category} onChange={(e: any) => setCategory(e.target.value)}>
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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Unterstützt: PDF, Word, Text, Markdown (max. 10MB)
          </p>
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Abbrechen
          </Button>
          <Button
            onClick={handleUpload}
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
