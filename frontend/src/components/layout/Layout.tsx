import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

