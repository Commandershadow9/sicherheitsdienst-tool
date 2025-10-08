import { Modal } from '@/components/ui/modal'
import { Loader2, User, Briefcase, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'

type EmployeeListModalProps = {
  open: boolean
  onClose: () => void
  filter: 'all' | 'available' | 'vacation' | 'sick'
  title: string
}

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  absenceStart?: string
  absenceEnd?: string
}

const FILTER_ENDPOINTS: Record<string, string> = {
  all: '/users?role=EMPLOYEE',
  available: '/dashboard/employees/available',
  vacation: '/dashboard/employees/on-vacation',
  sick: '/dashboard/employees/on-sick-leave',
}

const FILTER_DESCRIPTIONS: Record<string, string> = {
  all: 'Alle Mitarbeiter im System',
  available: 'Mitarbeiter die heute verfügbar sind (keine Abwesenheit)',
  vacation: 'Mitarbeiter die sich aktuell im Urlaub befinden',
  sick: 'Mitarbeiter die aktuell krankgemeldet sind',
}

export function EmployeeListModal({ open, onClose, filter, title }: EmployeeListModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employees', filter],
    queryFn: async () => {
      const endpoint = FILTER_ENDPOINTS[filter]
      const response = await api.get(endpoint)

      // Handle different response formats
      if (response.data.data) {
        return response.data.data as Employee[]
      }
      return response.data as Employee[]
    },
    enabled: open,
  })

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{FILTER_DESCRIPTIONS[filter]}</p>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
            <span className="ml-2 text-sm text-muted-foreground">Lade Mitarbeiter...</span>
          </div>
        )}

        {isError && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Fehler beim Laden der Mitarbeiterliste. Bitte versuche es erneut.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Keine Mitarbeiter in dieser Kategorie gefunden.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {data.length} {data.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} gefunden
                </div>
                <ul className="space-y-2">
                  {data.map((employee) => {
                    const absenceStart = employee.absenceStart ? new Date(employee.absenceStart) : null
                    const absenceEnd = employee.absenceEnd ? new Date(employee.absenceEnd) : null
                    const hasAbsencePeriod = Boolean(absenceStart && absenceEnd)
                    const formatDate = (date: Date) => {
                      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                    }

                    return (
                      <li key={employee.id}>
                        <Link
                          to={`/users/${employee.id}/profile`}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded border border-border bg-background/60 p-3 hover:bg-accent hover:border-primary/50 transition-all group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <User className="h-5 w-5 text-primary" aria-hidden />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium group-hover:text-primary transition-colors">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{employee.email}</div>
                            {hasAbsencePeriod && absenceStart && absenceEnd && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" aria-hidden />
                                <span>
                                  {formatDate(absenceStart)} - {formatDate(absenceEnd)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3" aria-hidden />
                            {employee.role}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
