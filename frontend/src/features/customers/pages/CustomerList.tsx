import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomers, useDeleteCustomer } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/lib/utils';
import { Customer } from '../../../types/customer';
import { Building2, Search, Plus, Pencil, Trash2, MapPin, Users } from 'lucide-react';

export default function CustomerList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading } = useCustomers({ search: searchTerm || undefined });
  const deleteMutation = useDeleteCustomer();

  const allIds = useMemo(() => data?.customers?.map((c) => c.id) || [], [data]);
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/customers/${id}`)))
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`${ids.length} Kunde(n) erfolgreich gelöscht`)
      setSelectedIds([])
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen der Kunden')
    },
  })

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteId(null);
      },
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-indigo-600" />
              Kundenverwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Kunden und deren Objekte
            </p>
          </div>
          <Link
            to="/customers/new"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            Neuer Kunde
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Firma, Branche, Stadt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-indigo-900">{selectedIds.length} ausgewählt</span>
              <div className="h-6 w-px bg-indigo-300" />
              <button
                onClick={() => {
                  if (confirm(`Wirklich ${selectedIds.length} Kunde(n) löschen?`)) {
                    bulkDeleteMutation.mutate(selectedIds)
                  }
                }}
                className="px-3 py-1.5 text-sm text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Löschen
              </button>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-indigo-700 hover:text-indigo-800"
            >
              Auswahl aufheben
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Lade Kunden...</p>
          </div>
        )}

        {/* Customer List */}
        {!isLoading && data && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {data.customers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Keine Kunden gefunden</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-indigo-600 hover:text-indigo-700"
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => el && (el.indeterminate = isSomeSelected && !isAllSelected)}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Firma
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ansprechpartner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Standort
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Objekte
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.customers.map((customer: Customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(customer.id)}
                              onChange={() => toggleSelect(customer.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {customer.companyName}
                              </div>
                              {customer.industry && (
                                <div className="text-sm text-gray-500">
                                  {customer.industry}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm text-gray-900">
                                {customer.primaryContact.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.primaryContact.email}
                              </div>
                              {customer.primaryContact.phone && (
                                <div className="text-sm text-gray-500">
                                  {customer.primaryContact.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-1 text-sm text-gray-900">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <div>{customer.city}</div>
                                <div className="text-gray-500">{customer.postalCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {customer._count?.sites || customer.sites?.length || 0} Objekt(e)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/customers/${customer.id}/edit`);
                                }}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                                title="Bearbeiten"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(customer.id);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Summary */}
            {data.customers.length > 0 && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                {data.total} Kunde(n) gesamt
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kunde löschen?
              </h3>
              <p className="text-gray-600 mb-6">
                Möchten Sie diesen Kunden wirklich löschen? Diese Aktion kann nicht
                rückgängig gemacht werden.
                {data?.customers.find((c) => c.id === deleteId)?._count?.sites ? (
                  <span className="block mt-2 text-red-600 font-medium">
                    Warnung: Dieser Kunde hat noch{' '}
                    {data.customers.find((c) => c.id === deleteId)?._count?.sites}{' '}
                    zugeordnete(s) Objekt(e)!
                  </span>
                ) : null}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Lösche...' : 'Löschen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
