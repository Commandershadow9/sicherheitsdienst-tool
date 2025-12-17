import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '../api';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  Pencil,
  Users,
  Calendar,
  CreditCard,
  Briefcase,
} from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Lade Kundendaten...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">Kunde nicht gefunden</p>
            <button
              onClick={() => navigate('/customers')}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Kunden', href: '/customers', icon: Building2 },
    { label: customer.companyName },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.companyName}
            </h1>
            {customer.industry && (
              <p className="text-gray-600 mt-1">{customer.industry}</p>
            )}
          </div>
          <Link
            to={`/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Pencil className="w-4 h-4" />
            Bearbeiten
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Contact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Haupt-Ansprechpartner
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {customer.primaryContact.name}
                    </div>
                    {customer.primaryContact.position && (
                      <div className="text-sm text-gray-500">
                        {customer.primaryContact.position}
                      </div>
                    )}
                  </div>
                </div>
                {customer.primaryContact.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${customer.primaryContact.email}`}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {customer.primaryContact.email}
                    </a>
                  </div>
                )}
                {customer.primaryContact.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${customer.primaryContact.phone}`}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {customer.primaryContact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Contacts */}
            {customer.contacts && customer.contacts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Weitere Ansprechpartner
                </h2>
                <div className="space-y-4">
                  {customer.contacts.map((contact: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        {contact.position && (
                          <div className="text-sm text-gray-500">{contact.position}</div>
                        )}
                        {contact.email && (
                          <div className="text-sm text-indigo-600 mt-1">
                            <a href={`mailto:${contact.email}`}>{contact.email}</a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-sm text-gray-600 mt-1">{contact.phone}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {customer.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Notizen & Besonderheiten
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}

            {/* Sites */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Objekte ({customer.sites?.length || 0})
              </h2>
              {customer.sites && customer.sites.length > 0 ? (
                <div className="space-y-3">
                  {customer.sites.map((site: any) => (
                    <Link
                      key={site.id}
                      to={`/sites/${site.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 border border-transparent transition-all duration-200"
                    >
                      <div className="font-medium text-gray-900">{site.name}</div>
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {site.address}, {site.city}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Noch keine Objekte zugeordnet</p>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Firmensitz
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div>{customer.address}</div>
                <div>
                  {customer.postalCode} {customer.city}
                </div>
                <div>{customer.country}</div>
              </div>
            </div>

            {/* Billing Address */}
            {customer.billingAddress && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Rechnungsadresse
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>{customer.billingAddress.street}</div>
                  <div>
                    {customer.billingAddress.postalCode} {customer.billingAddress.city}
                  </div>
                  <div>{customer.billingAddress.country}</div>
                </div>
              </div>
            )}

            {/* Payment Terms */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Zahlungskonditionen
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Zahlungsziel:</span>
                  <span className="font-medium text-gray-900">{customer.paymentTerms}</span>
                </div>
                {customer.discount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rabatt:</span>
                    <span className="font-medium text-green-600">
                      {customer.discount}%
                    </span>
                  </div>
                )}
                {customer.taxId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Steuernummer:</span>
                    <span className="font-medium text-gray-900">{customer.taxId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Informationen
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Angelegt:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Aktualisiert:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(customer.updatedAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
