import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import SubNavbar from './SubNavbar'
import Sidebar from './Sidebar'
import { WorkspaceMetricsDrawer } from './WorkspaceMetricsDrawer'
import { SandboxTelemetryDrawer } from './SandboxTelemetryDrawer'
import { CommandPaletteProvider } from './CommandPalette'

export default function Layout() {
  const location = useLocation()
  // Sidebar appears only on sandbox detail pages
  const isSandboxDetail = !!location.pathname.match(/^\/sandboxes\//)

  return (
    <CommandPaletteProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#111111]">
        <WorkspaceMetricsDrawer />
        <SandboxTelemetryDrawer />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <SubNavbar />
          <div className="flex flex-1 overflow-hidden">
            {isSandboxDetail && <Sidebar />}
            <main className="flex-1 overflow-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </CommandPaletteProvider>
  )
}
