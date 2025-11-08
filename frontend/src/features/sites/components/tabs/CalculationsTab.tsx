import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Calculator, DollarSign, Send, Check, X, Eye, Download, Mail, Copy, Archive } from 'lucide-react'
import type { SiteCalculation } from '../../calculationApi'
import type { Site } from '../../types/site'

interface CalculationsTabProps {
  siteId: string
  site: Site
  calculations: SiteCalculation[]
  onSendCalculation: (id: string) => void
  onAcceptCalculation: (id: string) => void
  onRejectCalculation: (id: string) => void
  onDuplicateCalculation: (id: string) => void
  onArchiveCalculation: (id: string) => void
  onEmailCalculation: (calculationId: string, email: string) => void
  isPending?: {
    send?: boolean
    accept?: boolean
    duplicate?: boolean
    archive?: boolean
  }
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS = {
  DRAFT: 'Entwurf',
  SENT: 'Versendet',
  ACCEPTED: 'Angenommen',
  REJECTED: 'Abgelehnt',
  ARCHIVED: 'Archiviert',
}

export default function CalculationsTab({
  siteId,
  site,
  calculations,
  onSendCalculation,
  onAcceptCalculation,
  onRejectCalculation,
  onDuplicateCalculation,
  onArchiveCalculation,
  onEmailCalculation,
  isPending = {},
}: CalculationsTabProps) {
  const nav = useNavigate()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Kalkulationen</h2>
          <span className="text-sm text-gray-500">({calculations.length})</span>
        </div>
        <Button onClick={() => nav(`/sites/${siteId}/calculations/new`)}>
          <Calculator size={16} className="mr-2" />
          Neue Kalkulation
        </Button>
      </div>

      {calculations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Calculator size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kalkulationen</h3>
          <p className="text-gray-600 mb-4">
            Erstellen Sie eine neue Kalkulation für diesen Auftrag, um Angebote zu erstellen.
          </p>
          <Button onClick={() => nav(`/sites/${siteId}/calculations/new`)}>
            Erste Kalkulation erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {calculations
            .sort((a, b) => b.version - a.version)
            .map((calc) => (
              <div
                key={calc.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[calc.status]
                        }`}
                      >
                        {STATUS_LABELS[calc.status]}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        Version {calc.version}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(calc.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Personalkosten:</span>{' '}
                          <span className="font-semibold">
                            {calc.totalPersonnelCostMonthly.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}{' '}
                            /Monat
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Gemeinkosten:</span>{' '}
                          <span className="font-semibold">
                            {calc.totalOverheadMonthly.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Gewinn:</span>{' '}
                          <span className="font-semibold">
                            {calc.totalProfitMonthly.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign size={18} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              Gesamtpreis (monatlich)
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            {calc.totalPriceMonthly.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Stunden/Woche:</strong> Tag: {calc.hoursDay}, Nacht:{' '}
                      {calc.hoursNight}, Sa: {calc.hoursSaturday}, So: {calc.hoursSunday}
                      {calc.hoursHoliday > 0 && `, Feiertag: ${calc.hoursHoliday}`}
                    </div>

                    {calc.calculator && (
                      <div className="mt-2 text-sm text-gray-500">
                        Erstellt von: {calc.calculator.firstName} {calc.calculator.lastName}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Status-spezifische Actions */}
                    <div className="flex gap-2">
                      {calc.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSendCalculation(calc.id)}
                          disabled={isPending.send}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Send size={14} className="mr-1" />
                          Versenden
                        </Button>
                      )}
                      {calc.status === 'SENT' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAcceptCalculation(calc.id)}
                            disabled={isPending.accept}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check size={14} className="mr-1" />
                            Annehmen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRejectCalculation(calc.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X size={14} className="mr-1" />
                            Ablehnen
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Allgemeine Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => nav(`/sites/${siteId}/calculations/${calc.id}`)}
                        className="hover:bg-gray-50"
                      >
                        <Eye size={14} className="mr-1" />
                        Ansehen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`/api/sites/${siteId}/calculations/${calc.id}/pdf`, '_blank')
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Download size={14} className="mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEmailCalculation(calc.id, site.customerEmail || '')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Mail size={14} className="mr-1" />
                        E-Mail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicateCalculation(calc.id)}
                        disabled={isPending.duplicate}
                        className="hover:bg-gray-50"
                      >
                        <Copy size={14} className="mr-1" />
                        Duplizieren
                      </Button>
                      {calc.status !== 'ARCHIVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onArchiveCalculation(calc.id)}
                          disabled={isPending.archive}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <Archive size={14} className="mr-1" />
                          Archivieren
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
