import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../api';
import { CreateCustomerInput, CustomerContact } from '../../../types/customer';
import { Building2, Plus, X, ArrowLeft, FileEdit } from 'lucide-react';
import { toast } from '@/lib/utils';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: customer, isLoading } = useCustomer(id);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(id || '');

  const [formData, setFormData] = useState<CreateCustomerInput>({
    companyName: '',
    industry: '',
    taxId: '',
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
    discount: undefined,
    notes: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName,
        industry: customer.industry || '',
        taxId: customer.taxId || '',
        primaryContact: customer.primaryContact,
        contacts: customer.contacts || [],
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        country: customer.country,
        billingAddress: customer.billingAddress,
        paymentTerms: customer.paymentTerms,
        discount: customer.discount,
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Firmenname ist erforderlich');
      return;
    }
    if (!formData.primaryContact.name.trim() || !formData.primaryContact.email.trim()) {
      toast.error('Primärer Ansprechpartner (Name + Email) ist erforderlich');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
      toast.error('Adresse, Stadt und PLZ sind erforderlich');
      return;
    }

    const submitData: CreateCustomerInput = {
      ...formData,
      industry: formData.industry || undefined,
      taxId: formData.taxId || undefined,
      discount: formData.discount ? Number(formData.discount) : undefined,
      notes: formData.notes || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(submitData, {
        onSuccess: () => navigate('/customers'),
      });
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => navigate('/customers'),
      });
    }
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...(formData.contacts || []),
        { name: '', email: '', phone: '', position: '' },
      ],
    });
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      contacts: (formData.contacts || []).filter((_, i) => i !== index),
    });
  };

  const updateContact = (index: number, field: keyof CustomerContact, value: string) => {
    const newContacts = [...(formData.contacts || [])];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, contacts: newContacts });
  };

  if (isLoading && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Lade Kundendaten...</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = isEdit
    ? [
        { label: 'Kunden', href: '/customers', icon: Building2 },
        { label: customer?.companyName || 'Kunde', href: `/customers/${id}` },
        { label: 'Bearbeiten', icon: FileEdit },
      ]
    : [
        { label: 'Kunden', href: '/customers', icon: Building2 },
        { label: 'Neuer Kunde', icon: FileEdit },
      ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Firmen-Informationen */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Firmen-Informationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firmenname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branche
                </label>
                <input
                  type="text"
                  value={formData.industry || ''}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="z.B. Einzelhandel, IT, Produktion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Steuernummer
                </label>
                <input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Primärer Ansprechpartner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Primärer Ansprechpartner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.primaryContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.primaryContact.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.primaryContact.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.primaryContact.position || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, position: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="z.B. Geschäftsführer"
                />
              </div>
            </div>
          </div>

          {/* Weitere Ansprechpartner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Weitere Ansprechpartner
              </h2>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
            {!formData.contacts || formData.contacts.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine weiteren Ansprechpartner</p>
            ) : (
              <div className="space-y-4">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          value={contact.phone || ''}
                          onChange={(e) => updateContact(index, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <input
                          type="text"
                          value={contact.position || ''}
                          onChange={(e) => updateContact(index, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adresse */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straße & Hausnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Zahlungskonditionen */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Zahlungskonditionen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zahlungsbedingungen
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rabatt (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notizen */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Interne Notizen
            </h2>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Interne Notizen zu diesem Kunden..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Speichere...'
                : isEdit
                  ? 'Aktualisieren'
                  : 'Anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
