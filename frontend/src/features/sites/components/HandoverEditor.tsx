import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { RefreshCw, Save, Edit, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  category: 'DOCUMENTATION' | 'EQUIPMENT' | 'STATUS' | 'BRIEFING' | 'OTHER';
}

interface ProtocolField {
  field: string;
  type: 'TEXT' | 'DATETIME' | 'SIGNATURE' | 'BOOLEAN';
  required: boolean;
}

interface HandoverProcedures {
  checklist: ChecklistItem[];
  protocolFields: ProtocolField[];
  digitalProtocol: boolean;
  retentionPeriod: string;
  minimumHandoverDuration: number; // in minutes
}

interface HandoverEditorProps {
  handoverProcedures: HandoverProcedures | null;
  onSave: (data: HandoverProcedures) => void;
}

export default function HandoverEditor({ handoverProcedures, onSave }: HandoverEditorProps) {
  const [isEditing, setIsEditing] = useState(!handoverProcedures);
  const [data, setData] = useState<HandoverProcedures>(
    handoverProcedures || {
      checklist: [],
      protocolFields: [],
      digitalProtocol: true,
      retentionPeriod: '24 Monate',
      minimumHandoverDuration: 15,
    }
  );

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      description: '',
      required: true,
      category: 'DOCUMENTATION',
    };
    setData({ ...data, checklist: [...data.checklist, newItem] });
  };

  const updateChecklistItem = (
    id: string,
    field: keyof ChecklistItem,
    value: string | boolean
  ) => {
    setData({
      ...data,
      checklist: data.checklist.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeChecklistItem = (id: string) => {
    setData({ ...data, checklist: data.checklist.filter((item) => item.id !== id) });
  };

  const addProtocolField = () => {
    const newField: ProtocolField = { field: '', type: 'TEXT', required: true };
    setData({ ...data, protocolFields: [...data.protocolFields, newField] });
  };

  const updateProtocolField = (
    index: number,
    field: keyof ProtocolField,
    value: string | boolean
  ) => {
    setData({
      ...data,
      protocolFields: data.protocolFields.map((pf, i) =>
        i === index ? { ...pf, [field]: value } : pf
      ),
    });
  };

  const removeProtocolField = (index: number) => {
    setData({ ...data, protocolFields: data.protocolFields.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    onSave(data);
    setIsEditing(false);
    toast.success('Übergabe-Prozeduren gespeichert');
  };

  const getCategoryLabel = (category: ChecklistItem['category']) => {
    const labels = {
      DOCUMENTATION: 'Dokumentation',
      EQUIPMENT: 'Ausrüstung',
      STATUS: 'Status',
      BRIEFING: 'Einweisung',
      OTHER: 'Sonstiges',
    };
    return labels[category];
  };

  const getTypeLabel = (type: ProtocolField['type']) => {
    const labels = {
      TEXT: 'Text',
      DATETIME: 'Datum/Zeit',
      SIGNATURE: 'Unterschrift',
      BOOLEAN: 'Ja/Nein',
    };
    return labels[type];
  };

  if (!isEditing && handoverProcedures) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="text-blue-600" size={20} />
            <h4 className="font-semibold text-gray-900">Übergaben/Schichtwechsel</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-600 mb-1">Protokoll</p>
            <p className="text-sm font-medium text-gray-900">
              {handoverProcedures.digitalProtocol ? 'Digital' : 'Papier'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Mindest-Dauer</p>
            <p className="text-sm font-medium text-gray-900">
              {handoverProcedures.minimumHandoverDuration} Minuten
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Aufbewahrung</p>
            <p className="text-sm font-medium text-gray-900">
              {handoverProcedures.retentionPeriod}
            </p>
          </div>
        </div>

        {handoverProcedures.checklist.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Checkliste ({handoverProcedures.checklist.length})
            </p>
            <div className="space-y-2">
              {handoverProcedures.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <div
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 ${
                      item.required ? 'border-blue-600 bg-blue-100' : 'border-gray-300'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{getCategoryLabel(item.category)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {handoverProcedures.protocolFields.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Protokoll-Felder ({handoverProcedures.protocolFields.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {handoverProcedures.protocolFields.map((field, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{field.field}</p>
                  <p className="text-xs text-gray-500">
                    {getTypeLabel(field.type)} • {field.required ? 'Pflicht' : 'Optional'}
                  </p>
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
          <RefreshCw className="text-blue-600" size={20} />
          <h4 className="font-semibold text-gray-900">Übergaben/Schichtwechsel</h4>
        </div>
        {handoverProcedures && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      {/* Settings */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Einstellungen</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Protokoll-Art">
            <Select
              value={data.digitalProtocol ? 'digital' : 'paper'}
              onChange={(e: any) => setData({ ...data, digitalProtocol: e.target.value === 'digital' })}
            >
              <option value="digital">Digital (System)</option>
              <option value="paper">Papier (Wachbuch)</option>
            </Select>
          </FormField>
          <FormField label="Mindest-Dauer (Min)">
            <Input
              type="number"
              value={data.minimumHandoverDuration}
              onChange={(e) =>
                setData({ ...data, minimumHandoverDuration: parseInt(e.target.value) || 0 })
              }
              min="5"
            />
          </FormField>
          <FormField label="Aufbewahrungsfrist">
            <Input
              value={data.retentionPeriod}
              onChange={(e) => setData({ ...data, retentionPeriod: e.target.value })}
              placeholder="z.B. 24 Monate"
            />
          </FormField>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Übergabe-Checkliste</p>
          <Button onClick={addChecklistItem} size="sm" variant="outline" className="gap-1">
            <Plus size={14} />
            Punkt hinzufügen
          </Button>
        </div>

        {data.checklist.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
            Noch keine Checklisten-Punkte definiert
          </p>
        ) : (
          <div className="space-y-3">
            {data.checklist.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <FormField label="Beschreibung">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateChecklistItem(item.id, 'description', e.target.value)
                        }
                        placeholder="z.B. Übergabe-Protokoll ausgefüllt"
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Kategorie">
                        <Select
                          value={item.category}
                          onChange={(e: any) =>
                            updateChecklistItem(item.id, 'category', e.target.value)
                          }
                        >
                          <option value="DOCUMENTATION">Dokumentation</option>
                          <option value="EQUIPMENT">Ausrüstung</option>
                          <option value="STATUS">Status</option>
                          <option value="BRIEFING">Einweisung</option>
                          <option value="OTHER">Sonstiges</option>
                        </Select>
                      </FormField>
                      <FormField label="Pflicht">
                        <Select
                          value={item.required ? 'yes' : 'no'}
                          onChange={(e: any) =>
                            updateChecklistItem(item.id, 'required', e.target.value === 'yes')
                          }
                        >
                          <option value="yes">Ja (Pflicht)</option>
                          <option value="no">Nein (Optional)</option>
                        </Select>
                      </FormField>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeChecklistItem(item.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protocol Fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Protokoll-Felder</p>
          <Button onClick={addProtocolField} size="sm" variant="outline" className="gap-1">
            <Plus size={14} />
            Feld hinzufügen
          </Button>
        </div>

        {data.protocolFields.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
            Noch keine Protokoll-Felder definiert
          </p>
        ) : (
          <div className="space-y-3">
            {data.protocolFields.map((field, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField label="Feldname">
                      <Input
                        value={field.field}
                        onChange={(e) => updateProtocolField(idx, 'field', e.target.value)}
                        placeholder="z.B. Datum/Uhrzeit Übergabe"
                      />
                    </FormField>
                    <FormField label="Typ">
                      <Select
                        value={field.type}
                        onChange={(e: any) => updateProtocolField(idx, 'type', e.target.value)}
                      >
                        <option value="TEXT">Text</option>
                        <option value="DATETIME">Datum/Zeit</option>
                        <option value="SIGNATURE">Unterschrift</option>
                        <option value="BOOLEAN">Ja/Nein</option>
                      </Select>
                    </FormField>
                    <FormField label="Pflicht">
                      <Select
                        value={field.required ? 'yes' : 'no'}
                        onChange={(e: any) =>
                          updateProtocolField(idx, 'required', e.target.value === 'yes')
                        }
                      >
                        <option value="yes">Ja (Pflicht)</option>
                        <option value="no">Nein (Optional)</option>
                      </Select>
                    </FormField>
                  </div>
                  <Button
                    onClick={() => removeProtocolField(idx)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {handoverProcedures && (
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
