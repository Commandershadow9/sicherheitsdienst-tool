import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickApprovalModal } from '../QuickApprovalModal'
import type { PendingApproval } from '../types'
import type { CapacityWarning } from '@/features/absences/types'

const baseApproval: PendingApproval = {
  absenceId: 'abs-123',
  employee: {
    id: 'emp-1',
    firstName: 'Lisa',
    lastName: 'Müller',
    email: 'lisa@example.com',
  },
  type: 'VACATION',
  startsAt: '2025-10-10T00:00:00Z',
  endsAt: '2025-10-12T23:59:59Z',
  requestedDays: 3,
  reason: 'Familientermin',
  createdAt: '2025-10-01T08:00:00Z',
  leaveDaysSaldo: {
    annualLeaveDays: 30,
    takenDays: 12,
    requestedDays: 3,
    remainingDays: 15,
    remainingAfterApproval: 12,
  },
  warnings: {
    affectedShifts: 2,
    criticalShifts: 1,
    leaveDaysExceeded: false,
    shiftDetails: [],
  },
}

const sampleWarnings: CapacityWarning[] = [
  {
    shiftId: 'shift-1',
    shiftTitle: 'Shoppingcenter West - Tagschicht',
    siteId: 'site-1',
    siteName: 'Shoppingcenter West',
    date: '2025-10-10',
    required: 4,
    available: 2,
    shortage: 2,
  },
]

describe('QuickApprovalModal', () => {
  it('zeigt Warnungen und Mitarbeiterinformationen an', () => {
    render(
      <QuickApprovalModal
        open
        mode="approve"
        approval={baseApproval}
        warnings={sampleWarnings}
        warningsLoading={false}
        warningsError={null}
        loading={false}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />
    )

    expect(screen.getByText('Antrag genehmigen')).toBeInTheDocument()
    expect(screen.getByText('Lisa Müller')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('Shoppingcenter West - Tagschicht'))
    ).toBeInTheDocument()
    expect(screen.getByText(/Benötigt 4, verfügbar 2/)).toBeInTheDocument()
  })

  it('übermittelt Notiz beim Ablehnen', async () => {
    const onSubmit = vi.fn()
    render(
      <QuickApprovalModal
        open
        mode="reject"
        approval={baseApproval}
        warnings={[]}
        warningsLoading={false}
        warningsError={null}
        loading={false}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />
    )

    const textarea = screen.getByLabelText('Notiz (optional)')
    await userEvent.type(textarea, '  Bitte Rücksprache halten  ')

    const rejectButton = screen.getByRole('button', { name: 'Ablehnen' })
    await userEvent.click(rejectButton)

    expect(onSubmit).toHaveBeenCalledWith('Bitte Rücksprache halten')
  })
})
