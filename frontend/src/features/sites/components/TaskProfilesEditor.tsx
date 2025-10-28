import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { Briefcase, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskProfile {
  id: string;
  position: string; // e.g., "Objektleiter", "Schichtleiter", "Mitarbeiter"
  tasks: string[]; // Aufgaben
  authorities: string[]; // Befugnisse
  responsibilities: string[]; // Verantwortlichkeiten
}

interface TaskProfilesEditorProps {
  taskProfiles: TaskProfile[] | null;
  onSave: (data: TaskProfile[]) => void;
}

export default function TaskProfilesEditor({
  taskProfiles,
  onSave,
}: TaskProfilesEditorProps) {
  const [isEditing, setIsEditing] = useState(!taskProfiles || taskProfiles.length === 0);
  const [data, setData] = useState<TaskProfile[]>(
    taskProfiles || []
  );

  const handleSave = () => {
    if (data.length === 0) {
      toast.warning('Mindestens ein Postenprofile sollte definiert werden');
      return;
    }

    const hasInvalidProfiles = data.some(
      (profile) => !profile.position || profile.tasks.length === 0
    );
    if (hasInvalidProfiles) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    onSave(data);
    setIsEditing(false);
    toast.success('Aufgaben- und Postenprofile gespeichert');
  };

  const addProfile = () => {
    setData([
      ...data,
      {
        id: `profile-${Date.now()}`,
        position: '',
        tasks: [],
        authorities: [],
        responsibilities: [],
      },
    ]);
  };

  const removeProfile = (id: string) => {
    setData(data.filter((p) => p.id !== id));
  };

  const updateProfile = (id: string, updates: Partial<TaskProfile>) => {
    setData(data.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  if (!isEditing && taskProfiles && taskProfiles.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="text-indigo-600" size={20} />
            <h4 className="font-semibold text-gray-900">Aufgaben- & Postenprofile</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-3">
          {taskProfiles.map((profile) => (
            <div key={profile.id} className="border rounded-lg p-4 bg-white">
              <h5 className="font-semibold text-gray-900 mb-3">{profile.position}</h5>

              {profile.tasks.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Aufgaben:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {profile.tasks.map((task, idx) => (
                      <li key={idx} className="text-sm text-gray-900">
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.authorities.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Befugnisse:</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.authorities.map((auth, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {auth}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.responsibilities.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Verantwortlichkeiten:</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.responsibilities.map((resp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="text-indigo-600" size={20} />
          <h4 className="font-semibold text-gray-900">Aufgaben- & Postenprofile</h4>
        </div>
        <div className="flex gap-2">
          {taskProfiles && taskProfiles.length > 0 && (
            <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
              Abbrechen
            </Button>
          )}
          <Button onClick={addProfile} size="sm" variant="outline" className="gap-1">
            <Plus size={14} />
            Profil hinzufügen
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Briefcase size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">Keine Postenprofile definiert</p>
          <p className="text-sm text-gray-500 mb-4">
            Definieren Sie Aufgaben und Befugnisse für verschiedene Positionen
          </p>
          <Button onClick={addProfile} size="sm" className="gap-1">
            <Plus size={14} />
            Erstes Profil hinzufügen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((profile) => (
            <div key={profile.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-2 mb-4">
                <FormField label="Position *" className="flex-1">
                  <Select
                    value={profile.position}
                    onChange={(e: any) => updateProfile(profile.id, { position: e.target.value })}
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Objektleiter">Objektleiter</option>
                    <option value="Stellv. Objektleiter">Stellv. Objektleiter</option>
                    <option value="Schichtleiter">Schichtleiter</option>
                    <option value="Mitarbeiter">Mitarbeiter</option>
                    <option value="Springer">Springer</option>
                    <option value="Revierdienst">Revierdienst</option>
                    <option value="Pförtner">Pförtner</option>
                    <option value="Sonstige">Sonstige</option>
                  </Select>
                </FormField>

                <Button
                  onClick={() => removeProfile(profile.id)}
                  size="sm"
                  variant="ghost"
                  className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <FormField label="Aufgaben * (eine pro Zeile)">
                <textarea
                  value={profile.tasks.join('\n')}
                  onChange={(e) =>
                    updateProfile(profile.id, {
                      tasks: e.target.value.split('\n').filter((t) => t.trim()),
                    })
                  }
                  placeholder={'Objektüberwachung\nKontrollgänge durchführen\nBesucherempfang'}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </FormField>

              <FormField label="Befugnisse (eine pro Zeile)">
                <textarea
                  value={profile.authorities.join('\n')}
                  onChange={(e) =>
                    updateProfile(profile.id, {
                      authorities: e.target.value.split('\n').filter((a) => a.trim()),
                    })
                  }
                  placeholder={'Zugang zu allen Bereichen\nAnweisungen erteilen\nSchlüsselzugang'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </FormField>

              <FormField label="Verantwortlichkeiten (eine pro Zeile)">
                <textarea
                  value={profile.responsibilities.join('\n')}
                  onChange={(e) =>
                    updateProfile(profile.id, {
                      responsibilities: e.target.value.split('\n').filter((r) => r.trim()),
                    })
                  }
                  placeholder={'Schichtübergabe\nWachbuch führen\nVorfalldokumentation'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </FormField>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        {taskProfiles && taskProfiles.length > 0 && (
          <Button onClick={() => setIsEditing(false)} variant="outline">
            Abbrechen
          </Button>
        )}
        <Button onClick={handleSave} className="gap-2" disabled={data.length === 0}>
          <Save size={16} />
          Speichern
        </Button>
      </div>
    </div>
  );
}
