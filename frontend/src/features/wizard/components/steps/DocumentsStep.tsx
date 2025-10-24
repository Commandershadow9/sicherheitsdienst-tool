import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { FileText, Phone, Plus, X, AlertCircle } from 'lucide-react';

interface DocumentsStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface EmergencyContact {
  name: string;
  phone: string;
  role?: string;
}

export default function DocumentsStep({ data, onUpdate, onNext, onPrevious }: DocumentsStepProps) {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    data.documents?.emergencyContacts || []
  );
  const [notes, setNotes] = useState<string>(data.documents?.notes || '');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    phone: '',
    role: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddContact = () => {
    const newErrors: Record<string, string> = {};
    if (!newContact.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!newContact.phone.trim()) {
      newErrors.phone = 'Telefon ist erforderlich';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setEmergencyContacts([...emergencyContacts, { ...newContact }]);
    setNewContact({ name: '', phone: '', role: '' });
    setErrors({});
    setShowAddForm(false);
  };

  const handleRemoveContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    onUpdate({
      documents: {
        emergencyContacts,
        notes,
      },
    });
    onNext();
  };

  const handleSkip = () => {
    onUpdate({
      documents: {
        emergencyContacts: [],
        notes: '',
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Dokumente & Notfallkontakte
        </h2>
        <p className="text-gray-600 text-sm mb-3">
          Hinterlegen Sie wichtige Notfallkontakte für dieses Objekt
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Optional:</strong> Dokumente können später hochgeladen werden. Notfallkontakte
            sind wichtig für schnelle Erreichbarkeit im Ernstfall.
          </p>
        </div>
      </div>

      {/* Emergency Contacts */}
      {emergencyContacts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-red-600" />
            Notfallkontakte ({emergencyContacts.length})
          </div>

          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div
                key={index}
                className="border-2 border-red-200 bg-red-50 rounded-lg p-4 relative group hover:border-red-300 transition-colors"
              >
                <button
                  onClick={() => handleRemoveContact(index)}
                  className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Entfernen"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="pr-10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{contact.name}</h3>
                      {contact.role && <p className="text-sm text-gray-600 mb-2">{contact.role}</p>}
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Contact Form */}
      {showAddForm ? (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Neuer Notfallkontakt
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setErrors({});
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                  value={newContact.name}
                  onChange={(e) => {
                    setNewContact({ ...newContact, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full px-4 py-2 border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white`}
                  placeholder="z.B. Hausmeister, Eigentümer"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => {
                    setNewContact({ ...newContact, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  className={`w-full px-4 py-2 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white`}
                  placeholder="+49 123 456789"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rolle (optional)</label>
              <input
                type="text"
                value={newContact.role}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                placeholder="z.B. Hausmeister, Gebäudeleitung, Eigentümer"
              />
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
                onClick={handleAddContact}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Kontakt hinzufügen
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-6 py-4 bg-white hover:bg-red-50 border-2 border-dashed border-red-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-red-600 font-medium"
        >
          <Plus className="w-5 h-5" />
          Notfallkontakt hinzufügen
        </button>
      )}

      {/* Additional Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
          <FileText className="w-4 h-4" />
          Zusätzliche Hinweise (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="z.B. Besondere Zugangsregeln, Alarm-Codes, Schließzeiten..."
        />
      </div>

      {/* Info */}
      {emergencyContacts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-900 mb-1">
                {emergencyContacts.length} Notfallkontakt{emergencyContacts.length > 1 ? 'e' : ''}{' '}
                hinterlegt
              </div>
              <p className="text-sm text-green-700">
                Ihre Mitarbeiter haben im Notfall schnellen Zugriff auf diese Kontakte.
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
          ← Zurück zu Schritt 6
        </button>
        <div className="flex gap-3">
          {emergencyContacts.length === 0 && (
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
            Weiter zu Schritt 8
            <span className="text-sm opacity-75">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
