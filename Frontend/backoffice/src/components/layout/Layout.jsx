import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-y-auto" id="main-scroll">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
