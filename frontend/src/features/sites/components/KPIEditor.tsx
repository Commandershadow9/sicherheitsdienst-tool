import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { BarChart3, Save, Edit, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface KPI {
  id: string;
  name: string;
  target: string;
  measurement: string;
  frequency: string;
  unit?: string;
}

interface QualityAudit {
  type: string;
  frequency: string;
  responsible: string;
}

interface QualityMetrics {
  kpis: KPI[];
  audits: QualityAudit[];
  feedbackChannels: {
    employee: string;
    customer: string;
  };
  improvementProcess: string;
}

interface KPIEditorProps {
  qualityMetrics: QualityMetrics | null;
  onSave: (data: QualityMetrics) => void;
}

export default function KPIEditor({ qualityMetrics, onSave }: KPIEditorProps) {
  const [isEditing, setIsEditing] = useState(!qualityMetrics);
  const [data, setData] = useState<QualityMetrics>(
    qualityMetrics || {
      kpis: [],
      audits: [],
      feedbackChannels: { employee: '', customer: '' },
      improvementProcess: '',
    }
  );

  const addKPI = () => {
    const newKPI: KPI = {
      id: `kpi-${Date.now()}`,
      name: '',
      target: '',
      measurement: '',
      frequency: 'Monatlich',
    };
    setData({ ...data, kpis: [...data.kpis, newKPI] });
  };

  const updateKPI = (id: string, field: keyof KPI, value: string) => {
    setData({
      ...data,
      kpis: data.kpis.map((kpi) => (kpi.id === id ? { ...kpi, [field]: value } : kpi)),
    });
  };

  const removeKPI = (id: string) => {
    setData({ ...data, kpis: data.kpis.filter((kpi) => kpi.id !== id) });
  };

  const addAudit = () => {
    const newAudit: QualityAudit = { type: '', frequency: '', responsible: '' };
    setData({ ...data, audits: [...data.audits, newAudit] });
  };

  const updateAudit = (index: number, field: keyof QualityAudit, value: string) => {
    setData({
      ...data,
      audits: data.audits.map((audit, i) => (i === index ? { ...audit, [field]: value } : audit)),
    });
  };

  const removeAudit = (index: number) => {
    setData({ ...data, audits: data.audits.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    onSave(data);
    setIsEditing(false);
    toast.success('KPIs & Qualitätsmetriken gespeichert');
  };

  if (!isEditing && qualityMetrics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            <h4 className="font-semibold text-gray-900">KPIs & Qualitätssicherung</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        {qualityMetrics.kpis.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Kennzahlen ({qualityMetrics.kpis.length})
            </p>
            <div className="space-y-2">
              {qualityMetrics.kpis.map((kpi) => (
                <div key={kpi.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{kpi.name}</p>
                      <p className="text-sm text-gray-600">
                        Ziel: {kpi.target} • {kpi.frequency}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Messung: {kpi.measurement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {qualityMetrics.audits.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Audits ({qualityMetrics.audits.length})
            </p>
            <div className="space-y-2">
              {qualityMetrics.audits.map((audit, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900">{audit.type}</p>
                  <p className="text-sm text-gray-600">
                    {audit.frequency} • Verantwortlich: {audit.responsible}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Mitarbeiter-Feedback</p>
            <p className="text-sm text-gray-900">{qualityMetrics.feedbackChannels.employee || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Kunden-Feedback</p>
            <p className="text-sm text-gray-900">{qualityMetrics.feedbackChannels.customer || '-'}</p>
          </div>
        </div>

        {qualityMetrics.improvementProcess && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Verbesserungsprozess</p>
            <p className="text-sm text-gray-900">{qualityMetrics.improvementProcess}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={20} />
          <h4 className="font-semibold text-gray-900">KPIs & Qualitätssicherung</h4>
        </div>
        {qualityMetrics && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Kennzahlen (KPIs)</p>
          <Button onClick={addKPI} size="sm" variant="outline" className="gap-1">
            <Plus size={14} />
            KPI hinzufügen
          </Button>
        </div>

        {data.kpis.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
            Noch keine KPIs definiert
          </p>
        ) : (
          <div className="space-y-3">
            {data.kpis.map((kpi) => (
              <div key={kpi.id} className="p-3 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                    <FormField label="KPI-Name">
                      <Input
                        value={kpi.name}
                        onChange={(e) => updateKPI(kpi.id, 'name', e.target.value)}
                        placeholder="z.B. Reaktionszeit Alarm"
                      />
                    </FormField>
                    <FormField label="Zielwert">
                      <Input
                        value={kpi.target}
                        onChange={(e) => updateKPI(kpi.id, 'target', e.target.value)}
                        placeholder="z.B. < 2 Minuten"
                      />
                    </FormField>
                    <FormField label="Messmethode">
                      <Input
                        value={kpi.measurement}
                        onChange={(e) => updateKPI(kpi.id, 'measurement', e.target.value)}
                        placeholder="z.B. Automatisch via System"
                      />
                    </FormField>
                    <FormField label="Häufigkeit">
                      <Input
                        value={kpi.frequency}
                        onChange={(e) => updateKPI(kpi.id, 'frequency', e.target.value)}
                        placeholder="z.B. Monatlich, Quartalsweise"
                      />
                    </FormField>
                  </div>
                  <Button
                    onClick={() => removeKPI(kpi.id)}
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Qualitätsaudits</p>
          <Button onClick={addAudit} size="sm" variant="outline" className="gap-1">
            <Plus size={14} />
            Audit hinzufügen
          </Button>
        </div>

        {data.audits.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
            Noch keine Audits definiert
          </p>
        ) : (
          <div className="space-y-3">
            {data.audits.map((audit, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <FormField label="Audit-Typ">
                      <Input
                        value={audit.type}
                        onChange={(e) => updateAudit(idx, 'type', e.target.value)}
                        placeholder="z.B. Interne Prüfung"
                      />
                    </FormField>
                    <FormField label="Häufigkeit">
                      <Input
                        value={audit.frequency}
                        onChange={(e) => updateAudit(idx, 'frequency', e.target.value)}
                        placeholder="z.B. Quartalsweise"
                      />
                    </FormField>
                    <FormField label="Verantwortlich">
                      <Input
                        value={audit.responsible}
                        onChange={(e) => updateAudit(idx, 'responsible', e.target.value)}
                        placeholder="z.B. Objektleiter"
                      />
                    </FormField>
                  </div>
                  <Button
                    onClick={() => removeAudit(idx)}
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Channels */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Feedback-Kanäle</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Mitarbeiter-Feedback">
            <Input
              value={data.feedbackChannels.employee}
              onChange={(e) =>
                setData({
                  ...data,
                  feedbackChannels: { ...data.feedbackChannels, employee: e.target.value },
                })
              }
              placeholder="z.B. Monatliches Teamgespräch"
            />
          </FormField>
          <FormField label="Kunden-Feedback">
            <Input
              value={data.feedbackChannels.customer}
              onChange={(e) =>
                setData({
                  ...data,
                  feedbackChannels: { ...data.feedbackChannels, customer: e.target.value },
                })
              }
              placeholder="z.B. Quartalsweise Review-Meeting"
            />
          </FormField>
        </div>
      </div>

      {/* Improvement Process */}
      <FormField label="Verbesserungsprozess">
        <Input
          value={data.improvementProcess}
          onChange={(e) => setData({ ...data, improvementProcess: e.target.value })}
          placeholder="z.B. Lessons Learned nach jedem Vorfall"
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {qualityMetrics && (
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
