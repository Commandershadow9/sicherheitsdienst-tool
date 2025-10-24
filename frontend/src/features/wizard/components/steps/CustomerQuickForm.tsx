import { useState } from 'react';
import { Customer, CreateCustomerInput } from '../../../../types/customer';
import { useCreateCustomer } from '../../../customers/api';
import { Building2, User, Mail, Phone, MapPin, X, Loader2 } from 'lucide-react';

interface CustomerQuickFormProps {
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

export default function CustomerQuickForm({ onSuccess, onCancel }: CustomerQuickFormProps) {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    companyName: '',
    industry: '',
    primaryContact: {
      name: '',
      email: '',
      phone: '',
      position: '',
    },
    contacts: [],
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    paymentTerms: '30 Tage netto',
  });

  const createCustomerMutation = useCreateCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newCustomer = await createCustomerMutation.mutateAsync(formData);
      onSuccess(newCustomer);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kunden:', error);
    }
  };

  const handleChange = (field: keyof CreateCustomerInput, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleContactChange = (field: keyof CreateCustomerInput['primaryContact'], value: string) => {
    setFormData({
      ...formData,
      primaryContact: {
        ...formData.primaryContact,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Neuen Kunden anlegen
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Abbrechen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Info */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Firmen-Informationen</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmenname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. Mustermann GmbH"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branche
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. Einzelhandel, Industrie"
            />
          </div>
        </div>

        {/* Primary Contact */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Hauptansprechpartner
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.primaryContact.name}
                onChange={(e) => handleContactChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Max Mustermann"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                value={formData.primaryContact.position}
                onChange={(e) => handleContactChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Geschäftsführer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                E-Mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.primaryContact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="max.mustermann@firma.de"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                Telefon
              </label>
              <input
                type="tel"
                value={formData.primaryContact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+49 123 456789"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Adresse
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Straße & Hausnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Musterstraße 123"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="12345"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stadt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Musterstadt"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={createCustomerMutation.isPending}
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createCustomerMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Kunde erstellen & auswählen
          </button>
        </div>
      </form>
    </div>
  );
}
