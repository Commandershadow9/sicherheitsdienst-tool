import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Download, Maximize2, Minimize2 } from 'lucide-react'
import { Modal } from '../../../components/ui/modal'
import { Button } from '../../../components/ui/button'
import { api } from '@/lib/api'

interface DocumentViewerModalProps {
  siteId: string
  document: {
    id: string
    title: string
    filename: string
    mimeType: string
    fileSize: number
  }
  onClose: () => void
}

export default function DocumentViewerModal({ siteId, document, onClose }: DocumentViewerModalProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  // Für Text/Markdown: Content laden
  useEffect(() => {
    if (document.mimeType === 'text/plain' || document.mimeType === 'text/markdown') {
      setLoading(true)
      api
        .get<string>(`/sites/${siteId}/documents/${document.id}/download`, {
          responseType: 'text',
        })
        .then((res: any) => {
          setContent(res.data)
          setLoading(false)
        })
        .catch((_err: any) => {
          setError('Fehler beim Laden des Dokuments')
          setLoading(false)
        })
    }
  }, [siteId, document.id, document.mimeType])

  const handleDownload = () => {
    window.open(`${import.meta.env.VITE_API_URL}/sites/${siteId}/documents/${document.id}/download`, '_blank')
  }

  const renderContent = () => {
    // PDF: Browser-native Viewer
    if (document.mimeType === 'application/pdf') {
      return (
        <iframe
          src={`${import.meta.env.VITE_API_URL}/sites/${siteId}/documents/${document.id}/download`}
          className="w-full h-full border-0"
          title={document.title}
        />
      )
    }

    // Markdown
    if (document.mimeType === 'text/markdown') {
      if (loading) return <div className="p-8 text-center text-gray-500">Lädt...</div>
      if (error) return <div className="p-8 text-center text-red-600">{error}</div>
      return (
        <div className="p-8 overflow-y-auto h-full prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )
    }

    // Plain Text
    if (document.mimeType === 'text/plain') {
      if (loading) return <div className="p-8 text-center text-gray-500">Lädt...</div>
      if (error) return <div className="p-8 text-center text-red-600">{error}</div>
      return (
        <pre className="p-8 overflow-y-auto h-full text-sm font-mono whitespace-pre-wrap bg-gray-50">
          {content}
        </pre>
      )
    }

    // Word/Excel: Nur Download
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">
          Dieser Dateityp kann nicht direkt angezeigt werden.
          <br />
          Bitte laden Sie die Datei herunter.
        </p>
        <Button onClick={handleDownload}>
          <Download size={16} className="mr-2" />
          Herunterladen
        </Button>
      </div>
    )
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <span className="truncate">{document.title}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownload}>
              <Download size={16} />
            </Button>
          </div>
        </div>
      }
      size={fullscreen ? 'fullscreen' : 'xl'}
    >
      <div className={`${fullscreen ? 'h-screen' : 'h-[70vh]'} flex flex-col`}>
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </Modal>
  )
}
