import { useCallback, useMemo } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CriticalShiftsCard } from '@/features/dashboard/CriticalShiftsCard'
import { PendingApprovalsCard } from '@/features/dashboard/PendingApprovalsCard'
import { WarningsCard } from '@/features/dashboard/WarningsCard'
import { StatsCard } from '@/features/dashboard/StatsCard'
import { QuickApprovalModal } from '@/features/dashboard/QuickApprovalModal'
import { AbsenceDetailModal } from '@/features/absences/AbsenceDetailModal'
import { ReplacementCandidatesModal } from '@/features/absences/ReplacementCandidatesModal'
import type { CriticalShift, UpcomingWarning, PendingApproval } from '@/features/dashboard/types'
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
    (payload?: { shiftId: string; candidate: { firstName: string; lastName: string } }) => {
      const info = payload
        ? {
            shiftId: payload.shiftId,
            candidateName: `${payload.candidate.firstName} ${payload.candidate.lastName}`,
          }
        : undefined
      replacementModal.handleAssignmentSuccess(info)
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
          <CriticalShiftsCard
            shifts={queries.critical.data}
            isLoading={queries.critical.isLoading}
            isError={queries.critical.isError}
            onRetry={handleCriticalRetry}
            onFindReplacement={handleFindReplacementForCritical}
            loadingShiftId={loadingShiftId}
          />

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

        {/* Rechte Spalte */}
        <div className="space-y-6">
          <StatsCard
            stats={queries.stats.data}
            isLoading={queries.stats.isLoading}
            isError={queries.stats.isError}
            onRetry={handleStatsRetry}
          />

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

      <ReplacementCandidatesModal
        open={replacementModal.open}
        onClose={replacementModal.closeModal}
        shiftId={replacementModal.shift?.id ?? ''}
        shiftTitle={replacementModal.shift?.title ?? ''}
        candidates={replacementModal.candidates}
        onAssignSuccess={handleReplacementAssignSuccess}
      />
    </div>
  )
}
