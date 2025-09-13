import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'

type Shift = { id: string; title: string; startTime: string; endTime: string; status: string }

export default function SiteShifts() {
  const { id } = useParams<{ id: string }>()
  const { tokens } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['site-shifts', id],
    queryFn: async () => {
      const res = await api.get<Shift[]>(`/sites/${id}/shifts`)
      return res.data
    },
    enabled: Boolean(id),
  })

  const exportCsv = async () => {
    const url = `${api.defaults.baseURL}/sites/${id}/shifts`
    const res = await fetch(url!, {
      headers: {
        'Accept': 'text/csv',
        ...(tokens?.accessToken ? { 'Authorization': `Bearer ${tokens.accessToken}` } : {}),
      },
      credentials: 'include',
    })
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `site_${id}_shifts.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Schichten – Site {id}</h1>
        <button className="underline" onClick={exportCsv}>CSV Export</button>
      </div>
      {isLoading && <div>Lade…</div>}
      {isError && <div className="text-red-600">Fehler beim Laden</div>}
      {data && (
        <div className="border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Titel</th>
                <th className="text-left p-2">Start</th>
                <th className="text-left p-2">Ende</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={4} className="p-3 text-muted-foreground">Keine Schichten</td></tr>}
              {data.map((sh)=> (
                <tr key={sh.id} className="border-t">
                  <td className="p-2">{sh.title}</td>
                  <td className="p-2">{new Date(sh.startTime).toLocaleString()}</td>
                  <td className="p-2">{new Date(sh.endTime).toLocaleString()}</td>
                  <td className="p-2">{sh.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

