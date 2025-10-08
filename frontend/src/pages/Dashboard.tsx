import { useCallback, useMemo, useState, useRef } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CriticalShiftsCard } from '@/features/dashboard/CriticalShiftsCard'
import { PendingApprovalsCard } from '@/features/dashboard/PendingApprovalsCard'
import { WarningsCard } from '@/features/dashboard/WarningsCard'
import { StatsCard } from '@/features/dashboard/StatsCard'
import { QuickApprovalModal } from '@/features/dashboard/QuickApprovalModal'
import { AbsenceDetailModal } from '@/features/absences/AbsenceDetailModal'
import { ReplacementCandidatesModalV2 } from '@/features/absences/ReplacementCandidatesModalV2'
import { EmployeeListModal } from '@/features/dashboard/EmployeeListModal'
import type { CriticalShift, UpcomingWarning, PendingApproval, DashboardStats } from '@/features/dashboard/types'
import {
  useDashboardQueries,
  useApprovalModal,
  useReplacementModal,
  useAbsenceDetail,
  useManualRefresh,
} from '@/features/dashboard/hooks'

export default function Dashboard() {
  // Custom Hooks - State Management vereinfacht!
  const queries = useDashboardQueries()
  const approvalModal = useApprovalModal()
  const replacementModal = useReplacementModal()
  const absenceDetail = useAbsenceDetail()
  const { refreshing, handleRefresh } = useManualRefresh(queries)

  // Employee List Modal State
  const [employeeListModal, setEmployeeListModal] = useState<{
    open: boolean
    filter: 'all' | 'available' | 'vacation' | 'sick'
    title: string
  }>({
    open: false,
    filter: 'all',
    title: '',
  })

  // Refs für Scroll-Ziele
  const criticalShiftsRef = useRef<HTMLDivElement>(null)
  const pendingApprovalsRef = useRef<HTMLDivElement>(null)
  const warningsRef = useRef<HTMLDivElement>(null)

  // Memoized Values
  const loadingShiftId = useMemo(
    () => (replacementModal.loading ? replacementModal.shift?.id ?? null : null),
    [replacementModal.loading, replacementModal.shift?.id]
  )

  // Event Handlers (memoized)
  const handleFindReplacementForCritical = useCallback(
    (shift: CriticalShift) => {
      replacementModal.openModal(shift.shiftId, shift.shiftTitle)
    },
    [replacementModal]
  )

  const handleFindReplacementForWarning = useCallback(
    (warning: UpcomingWarning) => {
      replacementModal.openModal(warning.shiftId, warning.shiftTitle)
    },
    [replacementModal]
  )

  const handleReplacementAssignSuccess = useCallback(
    (payload?: { shiftId: string; candidateName: string }) => {
      replacementModal.handleAssignmentSuccess(payload)
    },
    [replacementModal]
  )

  const handleCriticalRetry = useCallback(() => queries.critical.refetch(), [queries.critical])
  const handleApprovalsRetry = useCallback(() => queries.approvals.refetch(), [queries.approvals])
  const handleStatsRetry = useCallback(() => queries.stats.refetch(), [queries.stats])
  const handleWarningsRetry = useCallback(() => queries.warnings.refetch(), [queries.warnings])

  const handleApprove = useCallback(
    (approval: PendingApproval) => approvalModal.openModal(approval, 'approve'),
    [approvalModal]
  )
  const handleReject = useCallback(
    (approval: PendingApproval) => approvalModal.openModal(approval, 'reject'),
    [approvalModal]
  )

  // StatsCard Click Handler
  const handleStatClick = useCallback((statKey: keyof DashboardStats) => {
    switch (statKey) {
      case 'totalEmployees':
        setEmployeeListModal({
          open: true,
          filter: 'all',
          title: 'Alle Mitarbeiter',
        })
        break
      case 'availableToday':
        setEmployeeListModal({
          open: true,
          filter: 'available',
          title: 'Verfügbare Mitarbeiter (heute)',
        })
        break
      case 'onVacation':
        setEmployeeListModal({
          open: true,
          filter: 'vacation',
          title: 'Mitarbeiter im Urlaub',
        })
        break
      case 'onSickLeave':
        setEmployeeListModal({
          open: true,
          filter: 'sick',
          title: 'Kranke Mitarbeiter',
        })
        break
      case 'criticalShiftsToday':
        criticalShiftsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      case 'pendingApprovals':
        pendingApprovalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      case 'upcomingWarnings':
        warningsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
    }
  }, [])

  const closeEmployeeListModal = useCallback(() => {
    setEmployeeListModal((prev) => ({ ...prev, open: false }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manager-Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Fokus: Kritische Schichten heute, offene Genehmigungen und Kapazitätswarnungen der nächsten Tage.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Aktualisieren
        </Button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Linke Spalte */}
        <div className="space-y-6">
          <div ref={criticalShiftsRef}>
            <CriticalShiftsCard
              shifts={queries.critical.data}
              isLoading={queries.critical.isLoading}
              isError={queries.critical.isError}
              onRetry={handleCriticalRetry}
              onFindReplacement={handleFindReplacementForCritical}
              loadingShiftId={loadingShiftId}
            />
          </div>

          <div ref={pendingApprovalsRef}>
            <PendingApprovalsCard
              approvals={queries.approvals.data}
              isLoading={queries.approvals.isLoading}
              isError={queries.approvals.isError}
              onRetry={handleApprovalsRetry}
              onApprove={handleApprove}
              onReject={handleReject}
              onOpenDetails={absenceDetail.openDetail}
              recentAssignments={replacementModal.recentAssignments}
            />
          </div>
        </div>

        {/* Rechte Spalte */}
        <div className="space-y-6">
          <StatsCard
            stats={queries.stats.data}
            isLoading={queries.stats.isLoading}
            isError={queries.stats.isError}
            onRetry={handleStatsRetry}
            onStatClick={handleStatClick}
          />

          <div ref={warningsRef}>
            <WarningsCard
              warnings={queries.warnings.data}
              isLoading={queries.warnings.isLoading}
              isError={queries.warnings.isError}
              onRetry={handleWarningsRetry}
              onFindReplacement={handleFindReplacementForWarning}
              loadingShiftId={loadingShiftId}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickApprovalModal
        open={approvalModal.open}
        mode={approvalModal.mode}
        approval={approvalModal.selectedApproval}
        warnings={approvalModal.warningDetails}
        warningsLoading={approvalModal.warningLoading}
        warningsError={approvalModal.warningError}
        loading={approvalModal.loading}
        onClose={approvalModal.closeModal}
        onSubmit={approvalModal.submitModal}
      />

      <AbsenceDetailModal
        absence={absenceDetail.absence}
        open={absenceDetail.open}
        onClose={absenceDetail.closeDetail}
      />

      <ReplacementCandidatesModalV2
        open={replacementModal.open}
        onClose={replacementModal.closeModal}
        shiftId={replacementModal.shift?.id ?? ''}
        shiftTitle={replacementModal.shift?.title ?? ''}
        candidates={replacementModal.candidates}
        onAssignSuccess={handleReplacementAssignSuccess}
      />

      <EmployeeListModal
        open={employeeListModal.open}
        onClose={closeEmployeeListModal}
        filter={employeeListModal.filter}
        title={employeeListModal.title}
      />
    </div>
  )
}
