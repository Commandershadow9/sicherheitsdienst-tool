import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { Shield, Plus, Trash2, MapPin, Clock, Route, Save, Edit, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ControlPoint {
  id: string;
  name: string;
  location: string;
  checkType: 'visual' | 'scan' | 'signature';
  instructions?: string;
}

interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  frequency: string; // e.g., "Alle 2 Stunden", "3x pro Schicht"
  estimatedDuration: number; // in minutes
  controlPoints: ControlPoint[];
}

interface ProtectionMeasures {
  accessControl?: {
    enabled: boolean;
    description: string;
    methods: string[]; // e.g., ["Schlüssel", "Transponder", "Biometrie"]
  };
  videoSurveillance?: {
    enabled: boolean;
    cameraCount: number;
    locations: string[];
    recordingDuration: number; // days
  };
  alarmSystem?: {
    enabled: boolean;
    type: string; // e.g., "Einbruchmeldeanlage", "Brandmeldeanlage"
    provider: string;
    emergencyContact: string;
  };
  patrolRoutes?: PatrolRoute[];
}

interface ProtectionMeasuresEditorProps {
  protectionMeasures: ProtectionMeasures | null;
  onSave: (data: ProtectionMeasures) => void;
}

export default function ProtectionMeasuresEditor({
  protectionMeasures,
  onSave,
}: ProtectionMeasuresEditorProps) {
  const [isEditing, setIsEditing] = useState(!protectionMeasures);
  const [data, setData] = useState<ProtectionMeasures>(
    protectionMeasures || {
      accessControl: { enabled: false, description: '', methods: [] },
      videoSurveillance: { enabled: false, cameraCount: 0, locations: [], recordingDuration: 30 },
      alarmSystem: { enabled: false, type: '', provider: '', emergencyContact: '' },
      patrolRoutes: [],
    }
  );

  const [activeTab, setActiveTab] = useState<'access' | 'video' | 'alarm' | 'patrol'>('patrol');

  const handleSave = () => {
    // Validation
    if (data.patrolRoutes && data.patrolRoutes.length > 0) {
      const hasInvalidRoutes = data.patrolRoutes.some(
        (route) => !route.name || !route.frequency || route.controlPoints.length === 0
      );
      if (hasInvalidRoutes) {
        toast.error('Bitte füllen Sie alle Pflichtfelder für Kontrollgänge aus');
        return;
      }
    }

    onSave(data);
    setIsEditing(false);
    toast.success('Schutzmaßnahmen gespeichert');
  };

  const addPatrolRoute = () => {
    setData({
      ...data,
      patrolRoutes: [
        ...(data.patrolRoutes || []),
        {
          id: `route-${Date.now()}`,
          name: '',
          description: '',
          frequency: '',
          estimatedDuration: 30,
          controlPoints: [],
        },
      ],
    });
  };

  const removePatrolRoute = (routeId: string) => {
    setData({
      ...data,
      patrolRoutes: data.patrolRoutes?.filter((r) => r.id !== routeId) || [],
    });
  };

  const updatePatrolRoute = (routeId: string, updates: Partial<PatrolRoute>) => {
    setData({
      ...data,
      patrolRoutes:
        data.patrolRoutes?.map((r) => (r.id === routeId ? { ...r, ...updates } : r)) || [],
    });
  };

  const addControlPoint = (routeId: string) => {
    setData({
      ...data,
      patrolRoutes:
        data.patrolRoutes?.map((r) =>
          r.id === routeId
            ? {
                ...r,
                controlPoints: [
                  ...r.controlPoints,
                  {
                    id: `cp-${Date.now()}`,
                    name: '',
                    location: '',
                    checkType: 'visual',
                    instructions: '',
                  },
                ],
              }
            : r
        ) || [],
    });
  };

  const removeControlPoint = (routeId: string, cpId: string) => {
    setData({
      ...data,
      patrolRoutes:
        data.patrolRoutes?.map((r) =>
          r.id === routeId
            ? { ...r, controlPoints: r.controlPoints.filter((cp) => cp.id !== cpId) }
            : r
        ) || [],
    });
  };

  const updateControlPoint = (routeId: string, cpId: string, updates: Partial<ControlPoint>) => {
    setData({
      ...data,
      patrolRoutes:
        data.patrolRoutes?.map((r) =>
          r.id === routeId
            ? {
                ...r,
                controlPoints: r.controlPoints.map((cp) =>
                  cp.id === cpId ? { ...cp, ...updates } : cp
                ),
              }
            : r
        ) || [],
    });
  };

  if (!isEditing && protectionMeasures) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-purple-600" size={20} />
            <h4 className="font-semibold text-gray-900">Schutzmaßnahmen & Kontrollgänge</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        {/* Display Patrol Routes */}
        {protectionMeasures.patrolRoutes && protectionMeasures.patrolRoutes.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-medium text-sm text-gray-700">Kontrollgänge/Rundgänge</h5>
            {protectionMeasures.patrolRoutes.map((route) => (
              <div key={route.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h6 className="font-medium text-gray-900">{route.name}</h6>
                    <p className="text-sm text-gray-600">{route.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Frequenz</div>
                    <div className="text-sm font-medium text-gray-900">{route.frequency}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>~{route.estimatedDuration} Min.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{route.controlPoints.length} Kontrollpunkte</span>
                  </div>
                </div>

                {route.controlPoints.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                    {route.controlPoints.map((cp, idx) => (
                      <div key={cp.id} className="text-sm">
                        <div className="font-medium text-gray-900">
                          {idx + 1}. {cp.name}
                        </div>
                        <div className="text-xs text-gray-600">{cp.location}</div>
                        {cp.instructions && (
                          <div className="text-xs text-gray-500 italic mt-1">{cp.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Display other measures */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {protectionMeasures.accessControl?.enabled && (
            <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
              <div className="font-medium text-sm text-blue-900 mb-1">Zugangskontrolle</div>
              <div className="text-xs text-blue-700">
                {protectionMeasures.accessControl.methods.join(', ')}
              </div>
            </div>
          )}

          {protectionMeasures.videoSurveillance?.enabled && (
            <div className="border rounded-lg p-3 bg-green-50 border-green-200">
              <div className="font-medium text-sm text-green-900 mb-1">Videoüberwachung</div>
              <div className="text-xs text-green-700">
                {protectionMeasures.videoSurveillance.cameraCount} Kameras
              </div>
            </div>
          )}

          {protectionMeasures.alarmSystem?.enabled && (
            <div className="border rounded-lg p-3 bg-red-50 border-red-200">
              <div className="font-medium text-sm text-red-900 mb-1">Alarmanlage</div>
              <div className="text-xs text-red-700">{protectionMeasures.alarmSystem.type}</div>
            </div>
          )}
        </div>

        {(!protectionMeasures.patrolRoutes || protectionMeasures.patrolRoutes.length === 0) && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Keine Kontrollgänge definiert
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-purple-600" size={20} />
          <h4 className="font-semibold text-gray-900">Schutzmaßnahmen & Kontrollgänge</h4>
        </div>
        {protectionMeasures && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('patrol')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'patrol'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <Route size={16} className="inline mr-1" />
          Kontrollgänge
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'access'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Zugangskontrolle
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'video'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Videoüberwachung
        </button>
        <button
          onClick={() => setActiveTab('alarm')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'alarm'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Alarmanlage
        </button>
      </div>

      {/* Patrol Routes Tab */}
      {activeTab === 'patrol' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Definieren Sie Kontrollgänge und Rundgänge mit Kontrollpunkten
            </p>
            <Button onClick={addPatrolRoute} size="sm" className="gap-1">
              <Plus size={14} />
              Rundgang hinzufügen
            </Button>
          </div>

          {data.patrolRoutes && data.patrolRoutes.length > 0 ? (
            <div className="space-y-4">
              {data.patrolRoutes.map((route) => (
                <div key={route.id} className="border rounded-lg p-4 bg-white space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Name des Rundgangs *">
                        <Input
                          value={route.name}
                          onChange={(e) => updatePatrolRoute(route.id, { name: e.target.value })}
                          placeholder="z.B. Hauptrundgang, Außenrundgang"
                        />
                      </FormField>

                      <FormField label="Frequenz *">
                        <Select
                          value={route.frequency}
                          onChange={(e: any) =>
                            updatePatrolRoute(route.id, { frequency: e.target.value })
                          }
                        >
                          <option value="">Bitte wählen</option>
                          <option value="Stündlich">Stündlich</option>
                          <option value="Alle 2 Stunden">Alle 2 Stunden</option>
                          <option value="Alle 3 Stunden">Alle 3 Stunden</option>
                          <option value="2x pro Schicht">2x pro Schicht</option>
                          <option value="3x pro Schicht">3x pro Schicht</option>
                          <option value="1x pro Nacht">1x pro Nacht</option>
                          <option value="Nach Bedarf">Nach Bedarf</option>
                        </Select>
                      </FormField>
                    </div>

                    <Button
                      onClick={() => removePatrolRoute(route.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <FormField label="Beschreibung">
                    <Input
                      value={route.description}
                      onChange={(e) =>
                        updatePatrolRoute(route.id, { description: e.target.value })
                      }
                      placeholder="Kurze Beschreibung des Rundgangs"
                    />
                  </FormField>

                  <FormField label="Geschätzte Dauer (Minuten)">
                    <Input
                      type="number"
                      value={route.estimatedDuration}
                      onChange={(e) =>
                        updatePatrolRoute(route.id, { estimatedDuration: parseInt(e.target.value) })
                      }
                      min="1"
                    />
                  </FormField>

                  {/* Control Points */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-sm text-gray-900">Kontrollpunkte</h6>
                      <Button
                        onClick={() => addControlPoint(route.id)}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Plus size={12} />
                        Kontrollpunkt
                      </Button>
                    </div>

                    {route.controlPoints.length === 0 ? (
                      <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed rounded">
                        Keine Kontrollpunkte definiert
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {route.controlPoints.map((cp, idx) => (
                          <div
                            key={cp.id}
                            className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500">
                                Punkt {idx + 1}
                              </span>
                              <Button
                                onClick={() => removeControlPoint(route.id, cp.id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <FormField label="Bezeichnung *">
                                <Input
                                  value={cp.name}
                                  onChange={(e) =>
                                    updateControlPoint(route.id, cp.id, { name: e.target.value })
                                  }
                                  placeholder="z.B. Haupteingang"
                                  className="text-sm"
                                />
                              </FormField>

                              <FormField label="Standort *">
                                <Input
                                  value={cp.location}
                                  onChange={(e) =>
                                    updateControlPoint(route.id, cp.id, {
                                      location: e.target.value,
                                    })
                                  }
                                  placeholder="z.B. Erdgeschoss, Nord"
                                  className="text-sm"
                                />
                              </FormField>
                            </div>

                            <FormField label="Kontrollart">
                              <Select
                                value={cp.checkType}
                                onChange={(e: any) =>
                                  updateControlPoint(route.id, cp.id, { checkType: e.target.value })
                                }
                                className="text-sm"
                              >
                                <option value="visual">Sichtkontrolle</option>
                                <option value="scan">QR/NFC Scan</option>
                                <option value="signature">Unterschrift</option>
                              </Select>
                            </FormField>

                            <FormField label="Anweisungen (optional)">
                              <Input
                                value={cp.instructions || ''}
                                onChange={(e) =>
                                  updateControlPoint(route.id, cp.id, {
                                    instructions: e.target.value,
                                  })
                                }
                                placeholder="z.B. Auf offene Fenster achten"
                                className="text-sm"
                              />
                            </FormField>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Route size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">Keine Kontrollgänge definiert</p>
              <p className="text-sm text-gray-500 mb-4">
                Fügen Sie Rundgänge mit Kontrollpunkten hinzu
              </p>
              <Button onClick={addPatrolRoute} size="sm" className="gap-1">
                <Plus size={14} />
                Ersten Rundgang hinzufügen
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Access Control Tab */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.accessControl?.enabled || false}
              onChange={(e) =>
                setData({
                  ...data,
                  accessControl: { ...data.accessControl!, enabled: e.target.checked },
                })
              }
              className="rounded"
            />
            <label className="text-sm font-medium">Zugangskontrolle aktiviert</label>
          </div>

          {data.accessControl?.enabled && (
            <div className="space-y-3">
              <FormField label="Beschreibung">
                <Input
                  value={data.accessControl.description}
                  onChange={(e) =>
                    setData({
                      ...data,
                      accessControl: { ...data.accessControl!, description: e.target.value },
                    })
                  }
                  placeholder="Beschreiben Sie die Zugangskontrolle"
                />
              </FormField>

              <FormField label="Methoden (Komma-getrennt)">
                <Input
                  value={data.accessControl.methods.join(', ')}
                  onChange={(e) =>
                    setData({
                      ...data,
                      accessControl: {
                        ...data.accessControl!,
                        methods: e.target.value.split(',').map((m) => m.trim()),
                      },
                    })
                  }
                  placeholder="z.B. Schlüssel, Transponder, Biometrie"
                />
              </FormField>
            </div>
          )}
        </div>
      )}

      {/* Video Surveillance Tab */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.videoSurveillance?.enabled || false}
              onChange={(e) =>
                setData({
                  ...data,
                  videoSurveillance: { ...data.videoSurveillance!, enabled: e.target.checked },
                })
              }
              className="rounded"
            />
            <label className="text-sm font-medium">Videoüberwachung aktiviert</label>
          </div>

          {data.videoSurveillance?.enabled && (
            <div className="space-y-3">
              <FormField label="Anzahl Kameras">
                <Input
                  type="number"
                  value={data.videoSurveillance.cameraCount}
                  onChange={(e) =>
                    setData({
                      ...data,
                      videoSurveillance: {
                        ...data.videoSurveillance!,
                        cameraCount: parseInt(e.target.value),
                      },
                    })
                  }
                  min="0"
                />
              </FormField>

              <FormField label="Aufbewahrungsdauer (Tage)">
                <Input
                  type="number"
                  value={data.videoSurveillance.recordingDuration}
                  onChange={(e) =>
                    setData({
                      ...data,
                      videoSurveillance: {
                        ...data.videoSurveillance!,
                        recordingDuration: parseInt(e.target.value),
                      },
                    })
                  }
                  min="1"
                />
              </FormField>

              <FormField label="Standorte (Komma-getrennt)">
                <Input
                  value={data.videoSurveillance.locations.join(', ')}
                  onChange={(e) =>
                    setData({
                      ...data,
                      videoSurveillance: {
                        ...data.videoSurveillance!,
                        locations: e.target.value.split(',').map((l) => l.trim()),
                      },
                    })
                  }
                  placeholder="z.B. Eingang, Parkplatz, Lager"
                />
              </FormField>
            </div>
          )}
        </div>
      )}

      {/* Alarm System Tab */}
      {activeTab === 'alarm' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.alarmSystem?.enabled || false}
              onChange={(e) =>
                setData({
                  ...data,
                  alarmSystem: { ...data.alarmSystem!, enabled: e.target.checked },
                })
              }
              className="rounded"
            />
            <label className="text-sm font-medium">Alarmanlage aktiviert</label>
          </div>

          {data.alarmSystem?.enabled && (
            <div className="space-y-3">
              <FormField label="Typ">
                <Select
                  value={data.alarmSystem.type}
                  onChange={(e: any) =>
                    setData({
                      ...data,
                      alarmSystem: { ...data.alarmSystem!, type: e.target.value },
                    })
                  }
                >
                  <option value="">Bitte wählen</option>
                  <option value="Einbruchmeldeanlage">Einbruchmeldeanlage (EMA)</option>
                  <option value="Brandmeldeanlage">Brandmeldeanlage (BMA)</option>
                  <option value="Gefahrenmeldeanlage">Gefahrenmeldeanlage (GMA)</option>
                  <option value="Kombiniert">Kombiniert</option>
                </Select>
              </FormField>

              <FormField label="Anbieter/Hersteller">
                <Input
                  value={data.alarmSystem.provider}
                  onChange={(e) =>
                    setData({
                      ...data,
                      alarmSystem: { ...data.alarmSystem!, provider: e.target.value },
                    })
                  }
                  placeholder="z.B. Telenot, Bosch, Siemens"
                />
              </FormField>

              <FormField label="Notfallkontakt">
                <Input
                  value={data.alarmSystem.emergencyContact}
                  onChange={(e) =>
                    setData({
                      ...data,
                      alarmSystem: { ...data.alarmSystem!, emergencyContact: e.target.value },
                    })
                  }
                  placeholder="Telefonnummer für Alarme"
                />
              </FormField>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {protectionMeasures && (
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
