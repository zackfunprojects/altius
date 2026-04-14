import { NavLink, useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import FourColorBar from './brand/FourColorBar'
import MountainMark from './brand/MountainMark'
import WordMark from './brand/WordMark'
import ElevationCounter from './brand/ElevationCounter'
import { Mountain, BookOpen, NotebookPen, Library, MessageCircle } from 'lucide-react'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `font-ui font-medium text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 transition-colors relative ${
          isActive
            ? 'text-signal-orange'
            : 'text-catalog-cream/70 hover:text-catalog-cream'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-signal-orange" />
          )}
        </>
      )}
    </NavLink>
  )
}

function MobileTabItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${
          isActive ? 'text-signal-orange' : 'text-catalog-cream/60'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.5} />
      <span className="font-ui font-medium text-[9px]">{label}</span>
    </NavLink>
  )
}

export default function AppShell({ children }) {
  const { profile } = useProfile()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      {/* Top: FourColorBar */}
      <FourColorBar />

      {/* Nav bar */}
      <nav className="bg-ink h-14 flex items-center px-4 sm:px-6">
        {/* Left: Logo lockup */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 mr-auto"
        >
          <MountainMark size="sm" />
          <WordMark size="sm" color="cream" />
        </button>

        {/* Center: Nav items (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
          <NavItem to="/trail">Trail</NavItem>
          <NavItem to="/learn">Learn</NavItem>
          <NavItem to="/expedition-log">Journal</NavItem>
          <NavItem to="/notebook">Notebook</NavItem>
        </div>

        {/* Right: Elevation counter */}
        <div className="ml-auto flex items-center gap-3">
          <ElevationCounter elevation={profile?.current_elevation || 0} />
          <button
            onClick={() => navigate('/settings')}
            className="text-catalog-cream/50 hover:text-catalog-cream transition-colors hidden sm:block"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="3" />
              <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.1 3.1L4.2 4.2M13.8 13.8L14.9 14.9M3.1 14.9L4.2 13.8M13.8 4.2L14.9 3.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-ink border-t border-white/5 flex items-center justify-around px-2 z-40">
        <MobileTabItem to="/trail" icon={Mountain} label="Trail" />
        <MobileTabItem to="/learn" icon={BookOpen} label="Learn" />
        <MobileTabItem to="/expedition-log" icon={NotebookPen} label="Journal" />
        <MobileTabItem to="/notebook" icon={Library} label="Notebook" />
        <MobileTabItem to="/chat" icon={MessageCircle} label="Sherpa" />
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="md:hidden h-16" />
    </div>
  )
}
