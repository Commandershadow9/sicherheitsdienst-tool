import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { Phone, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EscalationLevel {
  id: string;
  level: number; // 1, 2, 3...
  title: string; // e.g., "Routinemeldung", "Störung", "Notfall"
  description: string;
  contacts: string[]; // Who to contact
  responseTime: string; // e.g., "Sofort", "15 Min", "1 Stunde"
  examples: string[]; // Beispiele für diesen Fall
}

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
}

interface CommunicationPlan {
  escalationLevels: EscalationLevel[];
  contacts: Contact[];
  reportingProcedure?: string;
  documentationRequirements?: string;
}

interface CommunicationPlanEditorProps {
  communicationPlan: CommunicationPlan | null;
  onSave: (data: CommunicationPlan) => void;
}

export default function CommunicationPlanEditor({
  communicationPlan,
  onSave,
}: CommunicationPlanEditorProps) {
  const [isEditing, setIsEditing] = useState(!communicationPlan);
  const [data, setData] = useState<CommunicationPlan>(
    communicationPlan || {
      escalationLevels: [],
      contacts: [],
      reportingProcedure: '',
      documentationRequirements: '',
    }
  );

  const handleSave = () => {
    if (data.escalationLevels.length === 0) {
      toast.warning('Mindestens eine Eskalationsstufe sollte definiert werden');
    }

    onSave(data);
    setIsEditing(false);
    toast.success('Kommunikations- und Eskalationsplan gespeichert');
  };

  const addEscalationLevel = () => {
    const nextLevel = data.escalationLevels.length + 1;
    setData({
      ...data,
      escalationLevels: [
        ...data.escalationLevels,
        {
          id: `level-${Date.now()}`,
          level: nextLevel,
          title: '',
          description: '',
          contacts: [],
          responseTime: '',
          examples: [],
        },
      ],
    });
  };

  const removeEscalationLevel = (id: string) => {
    setData({
      ...data,
      escalationLevels: data.escalationLevels.filter((l) => l.id !== id),
    });
  };

  const updateEscalationLevel = (id: string, updates: Partial<EscalationLevel>) => {
    setData({
      ...data,
      escalationLevels: data.escalationLevels.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });
  };

  const addContact = () => {
    setData({
      ...data,
      contacts: [
        ...data.contacts,
        {
          id: `contact-${Date.now()}`,
          name: '',
          role: '',
          phone: '',
          email: '',
        },
      ],
    });
  };

  const removeContact = (id: string) => {
    setData({
      ...data,
      contacts: data.contacts.filter((c) => c.id !== id),
    });
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setData({
      ...data,
      contacts: data.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  if (!isEditing && communicationPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="text-green-600" size={20} />
            <h4 className="font-semibold text-gray-900">Kommunikation & Eskalation</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        {/* Escalation Levels */}
        {communicationPlan.escalationLevels.length > 0 && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Eskalationsstufen</h5>
            <div className="space-y-2">
              {communicationPlan.escalationLevels
                .sort((a, b) => a.level - b.level)
                .map((level) => (
                  <div key={level.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {level.level}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{level.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{level.description}</div>

                        {level.responseTime && (
                          <div className="text-xs text-gray-500 mt-2">
                            Reaktionszeit: <span className="font-medium">{level.responseTime}</span>
                          </div>
                        )}

                        {level.contacts.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-600">Kontakte:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {level.contacts.map((contact, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                                >
                                  {contact}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {level.examples.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-600">Beispiele:</div>
                            <ul className="list-disc list-inside mt-1">
                              {level.examples.map((example, idx) => (
                                <li key={idx} className="text-xs text-gray-700">
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {communicationPlan.contacts.length > 0 && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Kontakte</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {communicationPlan.contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.role}</div>
                  <div className="text-sm text-gray-900 font-mono mt-1">{contact.phone}</div>
                  {contact.email && (
                    <div className="text-xs text-gray-600 mt-1">{contact.email}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {communicationPlan.reportingProcedure && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Meldeverfahren</h5>
            <div className="text-sm text-gray-900 whitespace-pre-line">
              {communicationPlan.reportingProcedure}
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
          <Phone className="text-green-600" size={20} />
          <h4 className="font-semibold text-gray-900">Kommunikation & Eskalation</h4>
        </div>
        {communicationPlan && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      {/* Escalation Levels */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-gray-900">Eskalationsstufen</h5>
          <Button onClick={addEscalationLevel} size="sm" variant="outline" className="gap-1">
            <Plus size={12} />
            Stufe hinzufügen
          </Button>
        </div>

        {data.escalationLevels.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed rounded">
            Keine Eskalationsstufen definiert
          </div>
        ) : (
          <div className="space-y-4">
            {data.escalationLevels
              .sort((a, b) => a.level - b.level)
              .map((level) => (
                <div key={level.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {level.level}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Titel *">
                        <Input
                          value={level.title}
                          onChange={(e) => updateEscalationLevel(level.id, { title: e.target.value })}
                          placeholder="z.B. Routinemeldung, Störung, Notfall"
                          className="text-sm"
                        />
                      </FormField>

                      <FormField label="Reaktionszeit">
                        <Input
                          value={level.responseTime}
                          onChange={(e) =>
                            updateEscalationLevel(level.id, { responseTime: e.target.value })
                          }
                          placeholder="z.B. Sofort, 15 Min, 1 Stunde"
                          className="text-sm"
                        />
                      </FormField>
                    </div>

                    <Button
                      onClick={() => removeEscalationLevel(level.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <FormField label="Beschreibung">
                    <textarea
                      value={level.description}
                      onChange={(e) =>
                        updateEscalationLevel(level.id, { description: e.target.value })
                      }
                      placeholder="Beschreiben Sie, wann diese Stufe greift..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </FormField>

                  <FormField label="Zu informierende Kontakte (Komma-getrennt)">
                    <Input
                      value={level.contacts.join(', ')}
                      onChange={(e) =>
                        updateEscalationLevel(level.id, {
                          contacts: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                        })
                      }
                      placeholder="z.B. Objektleiter, Auftraggeber, Geschäftsführung"
                      className="text-sm"
                    />
                  </FormField>

                  <FormField label="Beispiele (Komma-getrennt)">
                    <Input
                      value={level.examples.join(', ')}
                      onChange={(e) =>
                        updateEscalationLevel(level.id, {
                          examples: e.target.value.split(',').map((e) => e.trim()).filter(Boolean),
                        })
                      }
                      placeholder="z.B. Beschädigung, Alarm, Brand"
                      className="text-sm"
                    />
                  </FormField>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-gray-900">Kontakte</h5>
          <Button onClick={addContact} size="sm" variant="outline" className="gap-1">
            <Plus size={12} />
            Kontakt hinzufügen
          </Button>
        </div>

        {data.contacts.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed rounded">
            Keine Kontakte definiert
          </div>
        ) : (
          <div className="space-y-3">
            {data.contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField label="Name">
                      <Input
                        value={contact.name}
                        onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                        placeholder="Name"
                        className="text-sm"
                      />
                    </FormField>

                    <FormField label="Rolle">
                      <Input
                        value={contact.role}
                        onChange={(e) => updateContact(contact.id, { role: e.target.value })}
                        placeholder="z.B. Objektleiter, Auftraggeber"
                        className="text-sm"
                      />
                    </FormField>

                    <FormField label="Telefon">
                      <Input
                        value={contact.phone}
                        onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                        placeholder="+49..."
                        className="text-sm"
                      />
                    </FormField>

                    <FormField label="E-Mail (optional)">
                      <Input
                        value={contact.email || ''}
                        onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                        placeholder="email@example.com"
                        className="text-sm"
                      />
                    </FormField>
                  </div>

                  <Button
                    onClick={() => removeContact(contact.id)}
                    size="sm"
                    variant="ghost"
                    className="mt-6 text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <FormField label="Meldeverfahren">
          <textarea
            value={data.reportingProcedure || ''}
            onChange={(e) => setData({ ...data, reportingProcedure: e.target.value })}
            placeholder="Beschreiben Sie das allgemeine Meldeverfahren..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Dokumentationsanforderungen">
          <textarea
            value={data.documentationRequirements || ''}
            onChange={(e) => setData({ ...data, documentationRequirements: e.target.value })}
            placeholder="Was muss wie dokumentiert werden..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {communicationPlan && (
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
