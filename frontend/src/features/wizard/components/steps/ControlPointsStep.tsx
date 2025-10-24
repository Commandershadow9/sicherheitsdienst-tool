import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { MapPin, Plus, X, Clock, Camera, Nfc, QrCode, AlertCircle } from 'lucide-react';

interface ControlPointsStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface ControlPoint {
  name: string;
  location: string;
  description?: string;
  nfcTagId?: string;
  qrCode?: string;
}

export default function ControlPointsStep({ data, onUpdate, onNext, onPrevious }: ControlPointsStepProps) {
  const [points, setPoints] = useState<ControlPoint[]>(data.controlPoints?.points || []);
  const [roundIntervalMinutes, setRoundIntervalMinutes] = useState<number>(
    data.controlPoints?.roundIntervalMinutes || 60
  );
  const [requirePhotos, setRequirePhotos] = useState<boolean>(data.controlPoints?.requirePhotos || false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPoint, setNewPoint] = useState<ControlPoint>({
    name: '',
    location: '',
    description: '',
    nfcTagId: '',
    qrCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddPoint = () => {
    // Validation
    const newErrors: Record<string, string> = {};
    if (!newPoint.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!newPoint.location.trim()) {
      newErrors.location = 'Standort ist erforderlich';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Add point
    setPoints([...points, { ...newPoint }]);
    setNewPoint({
      name: '',
      location: '',
      description: '',
      nfcTagId: '',
      qrCode: '',
    });
    setErrors({});
    setShowAddForm(false);
  };

  const handleRemovePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    onUpdate({
      controlPoints: {
        points,
        roundIntervalMinutes,
        requirePhotos,
      },
    });
    onNext();
  };

  const handleSkip = () => {
    onUpdate({
      controlPoints: {
        points: [],
        roundIntervalMinutes: 0,
        requirePhotos: false,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-indigo-600" />
          Kontrollgänge & NFC-Punkte
        </h2>
        <p className="text-gray-600 text-sm mb-3">
          Definieren Sie Kontrollpunkte für systematische Rundengänge
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Optional:</strong> Dieser Schritt ist optional. Kontrollpunkte können auch später
            in der Objekt-Verwaltung hinzugefügt werden.
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="text-sm font-medium text-gray-700 mb-3">Rundgang-Einstellungen</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Kontroll-Intervall (Minuten)
            </label>
            <input
              type="number"
              min="0"
              value={roundIntervalMinutes}
              onChange={(e) => setRoundIntervalMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. 60 für stündliche Kontrollen"
            />
            <p className="text-xs text-gray-500 mt-1">
              {roundIntervalMinutes > 0
                ? `Kontrollen alle ${roundIntervalMinutes} Minuten`
                : 'Kein festes Intervall'}
            </p>
          </div>

          {/* Require Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
              <Camera className="w-4 h-4" />
              Foto-Dokumentation
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requirePhotos}
                onChange={(e) => setRequirePhotos(e.target.checked)}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Foto bei jedem Kontrollpunkt erforderlich</span>
            </label>
          </div>
        </div>
      </div>

      {/* Existing Points */}
      {points.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-700 mb-4 flex items-center justify-between">
            <span>Kontrollpunkte ({points.length})</span>
          </div>

          <div className="space-y-3">
            {points.map((point, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors relative group"
              >
                <button
                  onClick={() => handleRemovePoint(index)}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Entfernen"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="pr-10">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{point.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {point.location}
                      </p>
                    </div>
                  </div>

                  {point.description && (
                    <p className="text-sm text-gray-600 mb-3 ml-13">{point.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 ml-13">
                    {point.nfcTagId && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs flex items-center gap-1">
                        <Nfc className="w-3 h-3" />
                        NFC: {point.nfcTagId}
                      </span>
                    )}
                    {point.qrCode && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        QR: {point.qrCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Point Form */}
      {showAddForm ? (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Neuer Kontrollpunkt</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setErrors({});
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPoint.name}
                  onChange={(e) => {
                    setNewPoint({ ...newPoint, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full px-4 py-2 border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                  placeholder="z.B. Haupteingang"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standort <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPoint.location}
                  onChange={(e) => {
                    setNewPoint({ ...newPoint, location: e.target.value });
                    if (errors.location) setErrors({ ...errors, location: '' });
                  }}
                  className={`w-full px-4 py-2 border ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                  placeholder="z.B. Erdgeschoss, Empfang"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (optional)</label>
              <textarea
                value={newPoint.description}
                onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="Zusätzliche Hinweise für Mitarbeiter..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NFC Tag ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Nfc className="w-4 h-4" />
                  NFC-Tag ID (optional)
                </label>
                <input
                  type="text"
                  value={newPoint.nfcTagId}
                  onChange={(e) => setNewPoint({ ...newPoint, nfcTagId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="z.B. NFC-12345"
                />
              </div>

              {/* QR Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <QrCode className="w-4 h-4" />
                  QR-Code (optional)
                </label>
                <input
                  type="text"
                  value={newPoint.qrCode}
                  onChange={(e) => setNewPoint({ ...newPoint, qrCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="z.B. QR-12345"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setErrors({});
                }}
                className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddPoint}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Kontrollpunkt hinzufügen
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-6 py-4 bg-white hover:bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-indigo-600 font-medium"
        >
          <Plus className="w-5 h-5" />
          Kontrollpunkt hinzufügen
        </button>
      )}

      {/* Empty State */}
      {points.length === 0 && !showAddForm && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-2">Noch keine Kontrollpunkte definiert</p>
          <p className="text-sm text-gray-500">
            Sie können Kontrollpunkte jetzt hinzufügen oder diesen Schritt überspringen
          </p>
        </div>
      )}

      {/* Info Box */}
      {points.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-900 mb-1">Kontrollpunkte erfasst</div>
              <p className="text-sm text-green-700">
                {points.length} Kontrollpunkt{points.length > 1 ? 'e' : ''} wurde
                {points.length > 1 ? 'n' : ''} definiert. Diese können später in der Objekt-Verwaltung
                bearbeitet werden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          ← Zurück zu Schritt 4
        </button>
        <div className="flex gap-3">
          {points.length === 0 && (
            <button
              onClick={handleSkip}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Überspringen
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            Weiter zu Schritt 6
            <span className="text-sm opacity-75">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
