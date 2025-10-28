import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { AlertTriangle, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available247?: boolean;
}

interface EmergencyPlan {
  fireResponse?: {
    procedure: string;
    assemblyPoints: string[];
    fireExtinguishers: string[];
    fireAlarm: string;
  };
  intrusionResponse?: {
    procedure: string;
    policeContact: string;
    secureAreas: string[];
  };
  evacuation?: {
    procedure: string;
    routes: string[];
    assemblyPoints: string[];
    responsiblePerson: string;
  };
  medicalEmergency?: {
    procedure: string;
    firstAidKits: string[];
    firstAidOfficers: string[];
  };
  emergencyContacts: EmergencyContact[];
}

interface EmergencyPlanEditorProps {
  emergencyPlan: EmergencyPlan | null;
  onSave: (data: EmergencyPlan) => void;
}

export default function EmergencyPlanEditor({
  emergencyPlan,
  onSave,
}: EmergencyPlanEditorProps) {
  const [isEditing, setIsEditing] = useState(!emergencyPlan);
  const [data, setData] = useState<EmergencyPlan>(
    emergencyPlan || {
      fireResponse: {
        procedure: '',
        assemblyPoints: [],
        fireExtinguishers: [],
        fireAlarm: '',
      },
      intrusionResponse: {
        procedure: '',
        policeContact: '',
        secureAreas: [],
      },
      evacuation: {
        procedure: '',
        routes: [],
        assemblyPoints: [],
        responsiblePerson: '',
      },
      medicalEmergency: {
        procedure: '',
        firstAidKits: [],
        firstAidOfficers: [],
      },
      emergencyContacts: [],
    }
  );

  const handleSave = () => {
    // Basic validation
    if (data.emergencyContacts.length === 0) {
      toast.warning('Es werden mindestens ein Notfallkontakt empfohlen');
    }

    onSave(data);
    setIsEditing(false);
    toast.success('Notfallplan gespeichert');
  };

  const addEmergencyContact = () => {
    setData({
      ...data,
      emergencyContacts: [
        ...data.emergencyContacts,
        {
          id: `contact-${Date.now()}`,
          name: '',
          role: '',
          phone: '',
          available247: false,
        },
      ],
    });
  };

  const removeEmergencyContact = (id: string) => {
    setData({
      ...data,
      emergencyContacts: data.emergencyContacts.filter((c) => c.id !== id),
    });
  };

  const updateEmergencyContact = (id: string, updates: Partial<EmergencyContact>) => {
    setData({
      ...data,
      emergencyContacts: data.emergencyContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  if (!isEditing && emergencyPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h4 className="font-semibold text-gray-900">Notfall & Evakuierung</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        {/* Emergency Contacts */}
        {emergencyPlan.emergencyContacts.length > 0 && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Notfallkontakte</h5>
            <div className="space-y-2">
              {emergencyPlan.emergencyContacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.role}</div>
                      <div className="text-sm text-gray-900 font-mono">{contact.phone}</div>
                    </div>
                    {contact.available247 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        24/7
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fire Response */}
        {emergencyPlan.fireResponse?.procedure && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Brand</h5>
            <div className="text-sm text-gray-900 whitespace-pre-line">
              {emergencyPlan.fireResponse.procedure}
            </div>
            {emergencyPlan.fireResponse.assemblyPoints.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600">Sammelplätze:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {emergencyPlan.fireResponse.assemblyPoints.map((point, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Intrusion Response */}
        {emergencyPlan.intrusionResponse?.procedure && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Einbruch</h5>
            <div className="text-sm text-gray-900 whitespace-pre-line">
              {emergencyPlan.intrusionResponse.procedure}
            </div>
            {emergencyPlan.intrusionResponse.policeContact && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Polizei: </span>
                <span className="font-mono font-medium">{emergencyPlan.intrusionResponse.policeContact}</span>
              </div>
            )}
          </div>
        )}

        {/* Evacuation */}
        {emergencyPlan.evacuation?.procedure && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Evakuierung</h5>
            <div className="text-sm text-gray-900 whitespace-pre-line">
              {emergencyPlan.evacuation.procedure}
            </div>
            {emergencyPlan.evacuation.responsiblePerson && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Verantwortlich: </span>
                <span className="font-medium">{emergencyPlan.evacuation.responsiblePerson}</span>
              </div>
            )}
          </div>
        )}

        {/* Medical Emergency */}
        {emergencyPlan.medicalEmergency?.procedure && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Medizinischer Notfall</h5>
            <div className="text-sm text-gray-900 whitespace-pre-line">
              {emergencyPlan.medicalEmergency.procedure}
            </div>
            {emergencyPlan.medicalEmergency.firstAidOfficers.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600">Ersthelfer:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {emergencyPlan.medicalEmergency.firstAidOfficers.map((person, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={20} />
          <h4 className="font-semibold text-gray-900">Notfall & Evakuierung</h4>
        </div>
        {emergencyPlan && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-gray-900">Notfallkontakte</h5>
          <Button onClick={addEmergencyContact} size="sm" variant="outline" className="gap-1">
            <Plus size={12} />
            Kontakt
          </Button>
        </div>

        {data.emergencyContacts.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed rounded">
            Keine Notfallkontakte definiert
          </div>
        ) : (
          <div className="space-y-3">
            {data.emergencyContacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField label="Name">
                      <Input
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(contact.id, { name: e.target.value })}
                        placeholder="z.B. Feuerwehr"
                        className="text-sm"
                      />
                    </FormField>
                    <FormField label="Rolle">
                      <Input
                        value={contact.role}
                        onChange={(e) => updateEmergencyContact(contact.id, { role: e.target.value })}
                        placeholder="z.B. Notruf, Objektleiter"
                        className="text-sm"
                      />
                    </FormField>
                  </div>
                  <Button
                    onClick={() => removeEmergencyContact(contact.id)}
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField label="Telefon">
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(contact.id, { phone: e.target.value })}
                      placeholder="z.B. 112"
                      className="text-sm"
                    />
                  </FormField>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={contact.available247}
                        onChange={(e) =>
                          updateEmergencyContact(contact.id, { available247: e.target.checked })
                        }
                        className="rounded"
                      />
                      24/7 erreichbar
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fire Response */}
      <div className="border rounded-lg p-4 bg-white">
        <h5 className="font-medium text-gray-900 mb-3">Brand</h5>
        <div className="space-y-3">
          <FormField label="Vorgehensweise">
            <textarea
              value={data.fireResponse?.procedure || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  fireResponse: { ...data.fireResponse!, procedure: e.target.value },
                })
              }
              placeholder="Beschreiben Sie die Vorgehensweise im Brandfall..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Sammelplätze (Komma-getrennt)">
            <Input
              value={(data.fireResponse?.assemblyPoints || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  fireResponse: {
                    ...data.fireResponse!,
                    assemblyPoints: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Parkplatz Süd, Wiese hinter Gebäude"
            />
          </FormField>

          <FormField label="Feuerlöscher-Standorte (Komma-getrennt)">
            <Input
              value={(data.fireResponse?.fireExtinguishers || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  fireResponse: {
                    ...data.fireResponse!,
                    fireExtinguishers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Flur EG, Treppenhaus 1. OG"
            />
          </FormField>

          <FormField label="Brandmeldeanlage-Info">
            <Input
              value={data.fireResponse?.fireAlarm || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  fireResponse: { ...data.fireResponse!, fireAlarm: e.target.value },
                })
              }
              placeholder="z.B. BMA Typ XY, Auslösung löst Feuerwehr-Alarm aus"
            />
          </FormField>
        </div>
      </div>

      {/* Intrusion Response */}
      <div className="border rounded-lg p-4 bg-white">
        <h5 className="font-medium text-gray-900 mb-3">Einbruch</h5>
        <div className="space-y-3">
          <FormField label="Vorgehensweise">
            <textarea
              value={data.intrusionResponse?.procedure || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  intrusionResponse: { ...data.intrusionResponse!, procedure: e.target.value },
                })
              }
              placeholder="Beschreiben Sie die Vorgehensweise bei Einbruch..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Polizei-Kontakt">
            <Input
              value={data.intrusionResponse?.policeContact || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  intrusionResponse: { ...data.intrusionResponse!, policeContact: e.target.value },
                })
              }
              placeholder="110 oder direkte Wache"
            />
          </FormField>

          <FormField label="Besonders zu sichernde Bereiche (Komma-getrennt)">
            <Input
              value={(data.intrusionResponse?.secureAreas || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  intrusionResponse: {
                    ...data.intrusionResponse!,
                    secureAreas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Serverraum, Tresorraum, Lager"
            />
          </FormField>
        </div>
      </div>

      {/* Evacuation */}
      <div className="border rounded-lg p-4 bg-white">
        <h5 className="font-medium text-gray-900 mb-3">Evakuierung</h5>
        <div className="space-y-3">
          <FormField label="Vorgehensweise">
            <textarea
              value={data.evacuation?.procedure || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  evacuation: { ...data.evacuation!, procedure: e.target.value },
                })
              }
              placeholder="Beschreiben Sie die Evakuierungsabläufe..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Fluchtwege (Komma-getrennt)">
            <Input
              value={(data.evacuation?.routes || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  evacuation: {
                    ...data.evacuation!,
                    routes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Haupttreppe, Nottreppe West"
            />
          </FormField>

          <FormField label="Sammelplätze (Komma-getrennt)">
            <Input
              value={(data.evacuation?.assemblyPoints || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  evacuation: {
                    ...data.evacuation!,
                    assemblyPoints: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Parkplatz Süd"
            />
          </FormField>

          <FormField label="Verantwortliche Person">
            <Input
              value={data.evacuation?.responsiblePerson || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  evacuation: { ...data.evacuation!, responsiblePerson: e.target.value },
                })
              }
              placeholder="z.B. Objektleiter, Brandschutzhelfer"
            />
          </FormField>
        </div>
      </div>

      {/* Medical Emergency */}
      <div className="border rounded-lg p-4 bg-white">
        <h5 className="font-medium text-gray-900 mb-3">Medizinischer Notfall</h5>
        <div className="space-y-3">
          <FormField label="Vorgehensweise">
            <textarea
              value={data.medicalEmergency?.procedure || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  medicalEmergency: { ...data.medicalEmergency!, procedure: e.target.value },
                })
              }
              placeholder="Beschreiben Sie die Vorgehensweise bei medizinischen Notfällen..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Erste-Hilfe-Kästen Standorte (Komma-getrennt)">
            <Input
              value={(data.medicalEmergency?.firstAidKits || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  medicalEmergency: {
                    ...data.medicalEmergency!,
                    firstAidKits: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Empfang, Pausenraum, Werkstatt"
            />
          </FormField>

          <FormField label="Ersthelfer (Komma-getrennt)">
            <Input
              value={(data.medicalEmergency?.firstAidOfficers || []).join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  medicalEmergency: {
                    ...data.medicalEmergency!,
                    firstAidOfficers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="z.B. Max Mustermann, Anna Schmidt"
            />
          </FormField>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {emergencyPlan && (
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
