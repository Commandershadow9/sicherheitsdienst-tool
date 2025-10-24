import { api } from '@/lib/api'

// ===== TYPES =====

export type CalculationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED'

export type PriceModel = {
  id: string
  name: string
  description?: string
  isActive: boolean

  // Basis-Stundensätze
  hourlyRateEmployee: number
  hourlyRateShiftLeader: number
  hourlyRateSiteManager: number

  // Zeitzuschläge (Prozent)
  nightSurcharge: number
  saturdaySurcharge: number
  sundaySurcharge: number
  holidaySurcharge: number

  // Qualifikationszuschläge (€/h)
  nslCertificateSurcharge: number
  dogHandlerSurcharge: number
  weaponLicenseSurcharge: number

  // Gemeinkosten & Marge
  overheadPercentage: number
  profitMarginPercentage: number

  createdAt: string
  updatedAt: string

  _count?: {
    calculations: number
  }
}

export type SiteCalculation = {
  id: string
  siteId: string
  priceModelId?: string
  version: number
  status: CalculationStatus

  // Anforderungen
  requiredStaff: number
  hoursPerWeek: number
  contractDurationMonths: number

  // Zeitverteilung
  hoursDay: number
  hoursNight: number
  hoursSaturday: number
  hoursSunday: number
  hoursHoliday: number

  // Personalstruktur
  employeeCount: number
  shiftLeaderCount: number
  siteManagerCount: number

  // Custom Rates (optional)
  customHourlyRateEmployee?: number
  customHourlyRateShiftLeader?: number
  customHourlyRateSiteManager?: number

  // Custom Surcharges (optional)
  customNightSurcharge?: number
  customSaturdaySurcharge?: number
  customSundaySurcharge?: number
  customHolidaySurcharge?: number

  // Zuschläge
  riskSurchargePercentage: number
  distanceSurcharge: number

  // Custom Overhead & Margin (optional)
  customOverheadPercentage?: number
  customProfitMarginPercentage?: number

  // Berechnete Kosten
  totalPersonnelCostMonthly: number
  totalOverheadMonthly: number
  totalProfitMonthly: number
  totalPriceMonthly: number

  // Einmalige Kosten
  setupCostUniform: number
  setupCostEquipment: number
  setupCostOther: number

  // Notizen
  notes?: string

  // Meta
  calculatedBy: string
  calculatedAt: string
  sentAt?: string
  acceptedAt?: string
  rejectedAt?: string

  createdAt: string
  updatedAt: string

  // Relations
  site?: {
    id: string
    name: string
    address: string
    city: string
  }
  priceModel?: {
    id: string
    name: string
  }
  calculator?: {
    id: string
    firstName: string
    lastName: string
  }
}

export type CalculationFormData = Omit<
  SiteCalculation,
  'id' | 'version' | 'calculatedBy' | 'calculatedAt' | 'sentAt' | 'acceptedAt' | 'rejectedAt' | 'createdAt' | 'updatedAt' | 'site' | 'calculator'
>

// ===== PRICE MODELS API =====

export async function fetchPriceModels(activeOnly?: boolean) {
  const params = new URLSearchParams()
  if (activeOnly) params.append('activeOnly', 'true')

  const res = await api.get<{ data: PriceModel[] }>(
    `/price-models?${params.toString()}`
  )
  return res.data.data
}

export async function fetchPriceModel(id: string) {
  const res = await api.get<{ data: PriceModel }>(`/price-models/${id}`)
  return res.data.data
}

export async function createPriceModel(data: Partial<PriceModel>) {
  const res = await api.post<{ data: PriceModel }>('/price-models', data)
  return res.data.data
}

export async function updatePriceModel(id: string, data: Partial<PriceModel>) {
  const res = await api.put<{ data: PriceModel }>(`/price-models/${id}`, data)
  return res.data.data
}

export async function deletePriceModel(id: string) {
  const res = await api.delete<{ message: string }>(`/price-models/${id}`)
  return res.data
}

// ===== CALCULATIONS API =====

export async function fetchSiteCalculations(siteId: string, status?: CalculationStatus) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)

  const res = await api.get<{ data: SiteCalculation[] }>(
    `/sites/${siteId}/calculations?${params.toString()}`
  )
  return res.data.data
}

export async function fetchSiteCalculation(siteId: string, calculationId: string) {
  const res = await api.get<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}`
  )
  return res.data.data
}

export async function createSiteCalculation(siteId: string, data: Partial<CalculationFormData>) {
  const res = await api.post<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations`,
    data
  )
  return res.data.data
}

export async function updateSiteCalculation(
  siteId: string,
  calculationId: string,
  data: Partial<CalculationFormData>
) {
  const res = await api.put<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}`,
    data
  )
  return res.data.data
}

export async function deleteSiteCalculation(siteId: string, calculationId: string) {
  const res = await api.delete<{ message: string }>(
    `/sites/${siteId}/calculations/${calculationId}`
  )
  return res.data
}

// ===== CALCULATION ACTIONS =====

export async function sendSiteCalculation(siteId: string, calculationId: string) {
  const res = await api.post<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}/send`
  )
  return res.data.data
}

export async function acceptSiteCalculation(siteId: string, calculationId: string) {
  const res = await api.post<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}/accept`
  )
  return res.data.data
}

export async function rejectSiteCalculation(siteId: string, calculationId: string, notes?: string) {
  const res = await api.post<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}/reject`,
    { notes }
  )
  return res.data.data
}

export async function archiveSiteCalculation(siteId: string, calculationId: string) {
  const res = await api.post<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}/archive`
  )
  return res.data.data
}

export async function duplicateSiteCalculation(siteId: string, calculationId: string) {
  const res = await api.post<{ data: SiteCalculation }>(
    `/sites/${siteId}/calculations/${calculationId}/duplicate`
  )
  return res.data.data
}

export async function sendCalculationEmailAPI(siteId: string, calculationId: string, recipientEmail: string) {
  const res = await api.post<{ message: string }>(
    `/sites/${siteId}/calculations/${calculationId}/send-email`,
    { recipientEmail }
  )
  return res.data
}
