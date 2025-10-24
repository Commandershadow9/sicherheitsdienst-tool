import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { BuildingType, BuildingTypeLabels } from '../../../../types/template';
import { Building2, MapPin, Square, Layers, FileText } from 'lucide-react';

interface ObjectStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ObjectStep({ data, onUpdate, onNext, onPrevious }: ObjectStepProps) {
  const [formData, setFormData] = useState({
    siteName: data.siteName || '',
    address: data.address || '',
    city: data.city || '',
    postalCode: data.postalCode || '',
    buildingType: data.buildingType || undefined,
    floorCount: data.floorCount || undefined,
    squareMeters: data.squareMeters || undefined,
    description: data.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof typeof formData, value: string | number | BuildingType | undefined) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.siteName.trim()) {
      newErrors.siteName = 'Objektname ist erforderlich';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Adresse ist erforderlich';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'PLZ ist erforderlich';
    }
    if (!formData.buildingType) {
      newErrors.buildingType = 'Gebäudetyp ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onUpdate(formData);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          Objekt-Grunddaten
        </h2>
        <p className="text-gray-600 text-sm">
          Erfassen Sie die grundlegenden Informationen zum Sicherheitsobjekt
        </p>
      </div>

      <form className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Grundlegende Informationen
          </div>

          {/* Object Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objektname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.siteName ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="z.B. Bürokomplex Musterstraße"
              autoFocus
            />
            {errors.siteName && (
              <p className="text-red-500 text-sm mt-1">{errors.siteName}</p>
            )}
          </div>

          {/* Building Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gebäudetyp <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.buildingType || ''}
              onChange={(e) => handleChange('buildingType', e.target.value as BuildingType)}
              className={`w-full px-4 py-2 border ${
                errors.buildingType ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">Bitte wählen...</option>
              {Object.entries(BuildingTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.buildingType && (
              <p className="text-red-500 text-sm mt-1">{errors.buildingType}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optionale Beschreibung des Objekts..."
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200 p-6 space-y-4">
          <div className="text-sm font-medium text-indigo-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Adresse
          </div>

          {/* Street */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Straße & Hausnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
              placeholder="Musterstraße 123"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Postal Code & City */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className={`w-full px-4 py-2 border ${
                  errors.postalCode ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                placeholder="12345"
              />
              {errors.postalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stadt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`w-full px-4 py-2 border ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                placeholder="Musterstadt"
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>
          </div>
        </div>

        {/* Building Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Gebäude-Details (optional)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Floor Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Layers className="w-4 h-4" />
                Anzahl Etagen
              </label>
              <input
                type="number"
                min="0"
                value={formData.floorCount || ''}
                onChange={(e) => handleChange('floorCount', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. 5"
              />
            </div>

            {/* Square Meters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Square className="w-4 h-4" />
                Fläche in m²
              </label>
              <input
                type="number"
                min="0"
                value={formData.squareMeters || ''}
                onChange={(e) => handleChange('squareMeters', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. 2500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Tipp:</strong> Die Gebäude-Details helfen bei der späteren Kalkulation
              und können für Berichte verwendet werden.
            </p>
          </div>
        </div>
      </form>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          ← Zurück zu Schritt 1
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          Weiter zu Schritt 3
          <span className="text-sm opacity-75">→</span>
        </button>
      </div>
    </div>
  );
}
