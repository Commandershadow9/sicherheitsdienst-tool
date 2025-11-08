import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Save, Edit, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AttachmentItem {
  id: string;
  name: string;
  type: 'FLOOR_PLAN' | 'EVACUATION_PLAN' | 'FIRE_SAFETY' | 'CONTACT_LIST' | 'CHECKLIST' | 'OTHER';
  required: boolean;
  filename?: string;
  fileUrl?: string;
  fileSize?: number;
  uploadedAt?: Date;
  status: 'MISSING' | 'UPLOADED' | 'EXPIRED';
}

interface Attachments {
  required: AttachmentItem[];
  optional: AttachmentItem[];
  completionPercentage: number;
}

interface AttachmentManagerProps {
  attachments: Attachments | null;
  onSave: (data: Attachments) => void;
}

const defaultRequiredAttachments: AttachmentItem[] = [
  { id: 'req-1', name: 'Lageplan Auftrag', type: 'FLOOR_PLAN', required: true, status: 'MISSING' },
  { id: 'req-2', name: 'Fluchtpläne (alle Stockwerke)', type: 'EVACUATION_PLAN', required: true, status: 'MISSING' },
  { id: 'req-3', name: 'Brandschutzordnung', type: 'FIRE_SAFETY', required: true, status: 'MISSING' },
  { id: 'req-4', name: 'Kontaktlisten (Notfall, Behörden, Kunde)', type: 'CONTACT_LIST', required: true, status: 'MISSING' },
  { id: 'req-5', name: 'Checklisten (Schichtbeginn, Rundgang, Übergabe)', type: 'CHECKLIST', required: true, status: 'MISSING' },
];

export default function AttachmentManager({ attachments, onSave }: AttachmentManagerProps) {
  const [isEditing, setIsEditing] = useState(!attachments);
  const [data, setData] = useState<Attachments>(
    attachments || {
      required: defaultRequiredAttachments,
      optional: [],
      completionPercentage: 0,
    }
  );

  const calculateCompletion = (items: AttachmentItem[]) => {
    const uploaded = items.filter((item) => item.status === 'UPLOADED').length;
    return items.length > 0 ? Math.round((uploaded / items.length) * 100) : 0;
  };

  const handleFileUpload = (attachmentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Implement actual backend file upload
    const updatedRequired = data.required.map((att) =>
      att.id === attachmentId
        ? {
            ...att,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileSize: file.size,
            uploadedAt: new Date(),
            status: 'UPLOADED' as const,
          }
        : att
    );

    const newData = {
      ...data,
      required: updatedRequired,
      completionPercentage: calculateCompletion(updatedRequired),
    };

    setData(newData);
    toast.success(`${file.name} hochgeladen`);
    event.target.value = '';
  };

  const removeAttachment = (attachmentId: string) => {
    const updatedRequired = data.required.map((att) =>
      att.id === attachmentId
        ? { ...att, filename: undefined, fileUrl: undefined, status: 'MISSING' as const }
        : att
    );

    setData({
      ...data,
      required: updatedRequired,
      completionPercentage: calculateCompletion(updatedRequired),
    });

    toast.success('Dokument entfernt');
  };

  const handleSave = () => {
    onSave(data);
    setIsEditing(false);
    toast.success('Anhänge gespeichert');
  };

  const getStatusIcon = (status: AttachmentItem['status']) => {
    switch (status) {
      case 'UPLOADED':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'EXPIRED':
        return <AlertCircle className="text-yellow-600" size={18} />;
      case 'MISSING':
      default:
        return <XCircle className="text-red-600" size={18} />;
    }
  };

  const getStatusLabel = (status: AttachmentItem['status']) => {
    switch (status) {
      case 'UPLOADED':
        return 'Hochgeladen';
      case 'EXPIRED':
        return 'Abgelaufen';
      case 'MISSING':
      default:
        return 'Fehlt';
    }
  };

  if (!isEditing && attachments) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            <h4 className="font-semibold text-gray-900">Anhänge & Dokumente</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        {/* Completion Bar */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Vollständigkeit</span>
            <span className="text-sm font-bold text-gray-900">{attachments.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                attachments.completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${attachments.completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {attachments.required.filter((a) => a.status === 'UPLOADED').length} von {attachments.required.length} Pflichtdokumenten hochgeladen
          </p>
        </div>

        {/* Required Attachments */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Pflichtdokumente</p>
          <div className="space-y-2">
            {attachments.required.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                {getStatusIcon(att.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{att.name}</p>
                  {att.filename ? (
                    <p className="text-xs text-gray-600">
                      {att.filename} ({(att.fileSize! / 1024).toFixed(1)} KB)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">{getStatusLabel(att.status)}</p>
                  )}
                </div>
                {att.status === 'UPLOADED' && att.fileUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(att.fileUrl, '_blank')}
                    className="gap-1"
                  >
                    <Download size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {attachments.optional.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Optionale Dokumente</p>
            <div className="space-y-2">
              {attachments.optional.map((att) => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <FileText size={18} className="text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{att.name}</p>
                    {att.filename && (
                      <p className="text-xs text-gray-600">
                        {att.filename} ({(att.fileSize! / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          <h4 className="font-semibold text-gray-900">Anhänge & Dokumente</h4>
        </div>
        {attachments && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      {/* Completion Bar */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Vollständigkeit</span>
          <span className="text-lg font-bold text-gray-900">{data.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              data.completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${data.completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {data.required.filter((a) => a.status === 'UPLOADED').length} von {data.required.length} Pflichtdokumenten hochgeladen
        </p>
      </div>

      {/* Required Attachments */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Pflichtdokumente</p>
        <div className="space-y-3">
          {data.required.map((att) => (
            <div
              key={att.id}
              className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">{getStatusIcon(att.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{att.name}</p>
                {att.filename ? (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-gray-600">
                      {att.filename} ({(att.fileSize! / 1024).toFixed(1)} KB)
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(att.fileUrl, '_blank')}
                      className="h-6 px-2 text-xs gap-1"
                    >
                      <Download size={12} />
                      Download
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">{getStatusLabel(att.status)}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {att.status === 'UPLOADED' ? (
                  <Button
                    onClick={() => removeAttachment(att.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Entfernen
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <label className="cursor-pointer">
                      <Upload size={14} />
                      Hochladen
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(att.id, e)}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Attachments Info */}
      {data.optional.length === 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Sie können zusätzliche optionale Dokumente hinzufügen (z.B. Gefährdungsbeurteilung,
            DSFA, Schulungsnachweise).
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        {attachments && (
          <Button onClick={() => setIsEditing(false)} variant="outline">
            Abbrechen
          </Button>
        )}
        <Button onClick={handleSave} className="gap-2">
          <Save size={16} />
          Speichern
        </Button>
      </div>
    </div>
  );
}
