import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { Building2, Save, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface SiteSituation {
  buildingType: string; // Gebäudetyp
  size: {
    area: number; // m²
    floors: number;
    rooms?: number;
  };
  usage: string; // Nutzungsart
  accessPoints: {
    main: string[];
    emergency: string[];
    delivery?: string[];
  };
  environmentalRisks?: string[]; // Umgebungsrisiken
  specialFeatures?: string; // Besonderheiten
  openingHours?: string;
  peakTimes?: string;
  parkingInfo?: string;
}

interface SiteSituationEditorProps {
  siteSituation: SiteSituation | null;
  onSave: (data: SiteSituation) => void;
}

export default function SiteSituationEditor({
  siteSituation,
  onSave,
}: SiteSituationEditorProps) {
  const [isEditing, setIsEditing] = useState(!siteSituation);
  const [data, setData] = useState<SiteSituation>(
    siteSituation || {
      buildingType: '',
      size: { area: 0, floors: 1, rooms: 0 },
      usage: '',
      accessPoints: { main: [], emergency: [], delivery: [] },
      environmentalRisks: [],
      specialFeatures: '',
      openingHours: '',
      peakTimes: '',
      parkingInfo: '',
    }
  );

  const handleSave = () => {
    if (!data.buildingType || !data.usage) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    onSave(data);
    setIsEditing(false);
    toast.success('Auftragsbeschreibung gespeichert');
  };

  if (!isEditing && siteSituation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} />
            <h4 className="font-semibold text-gray-900">Auftrags-/Lagebild</h4>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1">
            <Edit size={14} />
            Bearbeiten
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Gebäudetyp</p>
            <p className="font-semibold text-gray-900">{siteSituation.buildingType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Nutzung</p>
            <p className="font-semibold text-gray-900">{siteSituation.usage}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Fläche</p>
            <p className="font-semibold text-gray-900">{siteSituation.size.area} m²</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Etagen</p>
            <p className="font-semibold text-gray-900">{siteSituation.size.floors}</p>
          </div>
        </div>

        {siteSituation.accessPoints.main.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Hauptzugänge</p>
            <div className="flex flex-wrap gap-1">
              {siteSituation.accessPoints.main.map((access, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {access}
                </span>
              ))}
            </div>
          </div>
        )}

        {siteSituation.environmentalRisks && siteSituation.environmentalRisks.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Umgebungsrisiken</p>
            <div className="flex flex-wrap gap-1">
              {siteSituation.environmentalRisks.map((risk, idx) => (
                <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  {risk}
                </span>
              ))}
            </div>
          </div>
        )}

        {siteSituation.specialFeatures && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Besonderheiten</p>
            <p className="text-sm text-gray-900">{siteSituation.specialFeatures}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="text-blue-600" size={20} />
          <h4 className="font-semibold text-gray-900">Auftrags-/Lagebild</h4>
        </div>
        {siteSituation && (
          <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Abbrechen
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Gebäudetyp *">
          <Select
            value={data.buildingType}
            onChange={(e: any) => setData({ ...data, buildingType: e.target.value })}
          >
            <option value="">Bitte wählen</option>
            <option value="Bürogebäude">Bürogebäude</option>
            <option value="Industrieanlage">Industrieanlage</option>
            <option value="Einkaufszentrum">Einkaufszentrum</option>
            <option value="Wohnanlage">Wohnanlage</option>
            <option value="Lager/Logistik">Lager/Logistik</option>
            <option value="Krankenhaus">Krankenhaus</option>
            <option value="Schule/Universität">Schule/Universität</option>
            <option value="Hotel">Hotel</option>
            <option value="Parkhaus">Parkhaus</option>
            <option value="Sonstiges">Sonstiges</option>
          </Select>
        </FormField>

        <FormField label="Nutzungsart *">
          <Input
            value={data.usage}
            onChange={(e) => setData({ ...data, usage: e.target.value })}
            placeholder="z.B. Büronutzung, Produktion, Handel"
          />
        </FormField>

        <FormField label="Fläche (m²)">
          <Input
            type="number"
            value={data.size.area}
            onChange={(e) =>
              setData({ ...data, size: { ...data.size, area: parseInt(e.target.value) } })
            }
            min="0"
          />
        </FormField>

        <FormField label="Anzahl Etagen">
          <Input
            type="number"
            value={data.size.floors}
            onChange={(e) =>
              setData({ ...data, size: { ...data.size, floors: parseInt(e.target.value) } })
            }
            min="1"
          />
        </FormField>

        <FormField label="Anzahl Räume (optional)">
          <Input
            type="number"
            value={data.size.rooms || ''}
            onChange={(e) =>
              setData({
                ...data,
                size: { ...data.size, rooms: e.target.value ? parseInt(e.target.value) : 0 },
              })
            }
            min="0"
          />
        </FormField>

        <FormField label="Öffnungszeiten">
          <Input
            value={data.openingHours || ''}
            onChange={(e) => setData({ ...data, openingHours: e.target.value })}
            placeholder="z.B. Mo-Fr 7:00-18:00"
          />
        </FormField>
      </div>

      <FormField label="Hauptzugänge (Komma-getrennt)">
        <Input
          value={data.accessPoints.main.join(', ')}
          onChange={(e) =>
            setData({
              ...data,
              accessPoints: {
                ...data.accessPoints,
                main: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
              },
            })
          }
          placeholder="z.B. Haupteingang Nord, Seiteneingang Ost"
        />
      </FormField>

      <FormField label="Notausgänge (Komma-getrennt)">
        <Input
          value={data.accessPoints.emergency.join(', ')}
          onChange={(e) =>
            setData({
              ...data,
              accessPoints: {
                ...data.accessPoints,
                emergency: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
              },
            })
          }
          placeholder="z.B. Notausgang Süd, Fluchttreppe West"
        />
      </FormField>

      <FormField label="Anlieferung/Lieferantenzugang (Komma-getrennt)">
        <Input
          value={(data.accessPoints.delivery || []).join(', ')}
          onChange={(e) =>
            setData({
              ...data,
              accessPoints: {
                ...data.accessPoints,
                delivery: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
              },
            })
          }
          placeholder="z.B. Laderampe Hof, Wareneingang"
        />
      </FormField>

      <FormField label="Umgebungsrisiken (Komma-getrennt)">
        <Input
          value={(data.environmentalRisks || []).join(', ')}
          onChange={(e) =>
            setData({
              ...data,
              environmentalRisks: e.target.value.split(',').map((r) => r.trim()).filter(Boolean),
            })
          }
          placeholder="z.B. Hochwassergefahr, Stark frequentierte Straße, Bahnlinie"
        />
      </FormField>

      <FormField label="Stoßzeiten/Verkehrsspitzen">
        <Input
          value={data.peakTimes || ''}
          onChange={(e) => setData({ ...data, peakTimes: e.target.value })}
          placeholder="z.B. Morgens 7-9 Uhr, Feierabend 16-18 Uhr"
        />
      </FormField>

      <FormField label="Parksituation">
        <Input
          value={data.parkingInfo || ''}
          onChange={(e) => setData({ ...data, parkingInfo: e.target.value })}
          placeholder="z.B. Tiefgarage mit 50 Plätzen, Parkplatz vor Gebäude"
        />
      </FormField>

      <FormField label="Besonderheiten">
        <textarea
          value={data.specialFeatures || ''}
          onChange={(e) => setData({ ...data, specialFeatures: e.target.value })}
          placeholder="Besondere Merkmale, Gefahrenstellen, architektonische Besonderheiten..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {siteSituation && (
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
