import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { Customer, CustomerSearchResult } from '../../../../types/customer';
import { useCustomerSearch } from '../../../customers/api';
import { Search, Building2, MapPin, Plus, Check, X } from 'lucide-react';
import CustomerQuickForm from './CustomerQuickForm';

interface CustomerStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onCancel: () => void;
}

export default function CustomerStep({ data, onUpdate, onNext, onCancel }: CustomerStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | CustomerSearchResult | null>(
    data.customer || null
  );
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  const { data: searchResults, isLoading } = useCustomerSearch(searchQuery);

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setShowNewCustomerForm(false);
    onUpdate({
      customer: customer as Customer,
      customerId: customer.id,
    });
  };

  const handleNewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowNewCustomerForm(false);
    onUpdate({
      customer,
      customerId: customer.id,
    });
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    onUpdate({
      customer: undefined,
      customerId: undefined,
    });
  };

  const handleNext = () => {
    if (selectedCustomer) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Selected Customer Display */}
      {selectedCustomer && !showNewCustomerForm && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-green-800 mb-1">
                  Ausgewählter Kunde
                </div>
                <div className="font-semibold text-gray-900 text-lg">
                  {selectedCustomer.companyName}
                </div>
                {selectedCustomer.industry && (
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedCustomer.industry}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedCustomer.city}, {selectedCustomer.postalCode}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {selectedCustomer._count?.sites || 0} Objekt(e)
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Auswahl aufheben"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search or New Customer */}
      {!selectedCustomer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kunde auswählen oder anlegen
          </h2>

          {!showNewCustomerForm ? (
            <>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nach Firma, Branche oder Stadt suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {isLoading && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <p className="mt-2 text-sm">Suche...</p>
                    </div>
                  )}

                  {!isLoading && searchResults && searchResults.customers.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      <p>Keine Kunden gefunden</p>
                      <p className="text-sm mt-1">Versuchen Sie andere Suchbegriffe</p>
                    </div>
                  )}

                  {!isLoading && searchResults && searchResults.customers.length > 0 && (
                    <div className="divide-y divide-gray-200">
                      {searchResults.customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-150 flex items-start justify-between group"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-indigo-600">
                              {customer.companyName}
                            </div>
                            {customer.industry && (
                              <div className="text-sm text-gray-600 mt-0.5">
                                {customer.industry}
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {customer.city}, {customer.postalCode}
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {customer._count.sites} Objekt(e)
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
                              Auswählen
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Geben Sie mindestens 2 Zeichen ein, um zu suchen</p>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">oder</span>
                </div>
              </div>

              {/* New Customer Button */}
              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors duration-200 font-medium"
              >
                <Plus className="w-5 h-5" />
                Neuen Kunden anlegen
              </button>
            </>
          ) : (
            <CustomerQuickForm
              onSuccess={handleNewCustomer}
              onCancel={() => setShowNewCustomerForm(false)}
            />
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          Abbrechen
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedCustomer}
          className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Weiter zu Schritt 2
          <span className="text-sm opacity-75">→</span>
        </button>
      </div>
    </div>
  );
}
