import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Users, FileText, CreditCard, StickyNote, Settings, ChevronLeft, ChevronRight, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Students', icon: Users, path: '/students' },
  { label: 'Documents', icon: FileText, path: '/documents' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Notes', icon: StickyNote, path: '/notes' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

const LANGS = [
  { code: 'fr', label: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'ع', dir: 'rtl' },
  { code: 'en', label: 'EN', dir: 'ltr' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [lang, setLang] = useState(() => localStorage.getItem('uni_lang') || 'fr')
  const { user, logout } = useAuth()

  const applyLang = (l: string) => {
    setLang(l)
    localStorage.setItem('uni_lang', l)
    document.documentElement.setAttribute('lang', l)
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr')
  }

  // Apply on mount
  useState(() => { applyLang(lang) })
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx('flex flex-col bg-navy-900 transition-all duration-300 relative flex-shrink-0',
        collapsed ? 'w-16' : 'w-56')}>
        {/* Logo */}
        <div className={clsx('flex items-center h-16 px-4 border-b border-white/5', collapsed ? 'justify-center' : 'gap-3')}>
          <img src="/logo.png" alt="FORSA" className="w-8 h-8 flex-shrink-0 object-contain" />
          {!collapsed && (
            <div>
              <p className="text-white font-semibold text-sm leading-none">FORSA</p>
              <p className="text-teal-400 text-xs mt-0.5">University Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <NavLink key={item.path} to={item.path}
                title={collapsed ? item.label : undefined}
                className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive ? 'bg-teal-500/15 text-teal-400' : 'text-navy-300 hover:bg-white/5 hover:text-white',
                  collapsed && 'justify-center px-2')}>
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Read-only badge */}
        {!collapsed && (
          <div className="mx-3 mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-400 text-xs font-medium">🔒 Read-only access</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Viewing your students only</p>
          </div>
        )}

        {/* User */}
        <div className={clsx('border-t border-white/5 p-3', collapsed && 'flex flex-col items-center gap-2')}>
          {!collapsed && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 bg-teal-500/20 rounded-full flex items-center justify-center">
                <span className="text-teal-400 text-xs font-semibold">{user?.email?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.email}</p>
                <p className="text-navy-400 text-xs">University Admin</p>
              </div>
            </div>
          )}
          <button onClick={logout} title={collapsed ? 'Sign out' : undefined}
            className={clsx('flex items-center gap-2 text-navy-400 hover:text-red-400 transition-colors text-xs w-full px-1 py-1 rounded',
              collapsed && 'justify-center')}>
            <LogOut size={14} />
            {!collapsed && 'Sign out'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md z-10">
          {collapsed ? <ChevronRight size={12} className="text-gray-500" /> : <ChevronLeft size={12} className="text-gray-500" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => applyLang(l.code)}
                  className={['text-xs font-semibold px-2.5 py-1 rounded-md transition-all',
                    lang === l.code ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                  {l.label}
                </button>
              ))}
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{user?.email?.[0]?.toUpperCase()}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
