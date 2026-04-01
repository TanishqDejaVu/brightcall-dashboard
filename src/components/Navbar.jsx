import { useState } from 'react'
import { RefreshCw, User, ChevronDown, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import dejavuLogo from '../assets/dejavu-logo.png'

const TABS = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
  { id: '6m', label: '6M' },
  { id: 'all', label: 'ALL' },
  { id: 'custom', label: 'Custom' },
]

const AGENTS = [
  { id: 'all', label: 'All Agents' },
  { id: '827909', label: 'Telesales 1' },
  { id: '827910', label: 'Telesales 2' },
  { id: '827911', label: 'Telesales 3' },
  { id: '827912', label: 'Telesales 4' },
]

export default function Navbar({ dateRange, selectedAgent, onRangeChange, onAgentChange, onRefresh, loading, lastUpdated, isDark, toggleTheme }) {
  const isCustom = typeof dateRange === 'object'
  const activeTab = isCustom ? 'custom' : dateRange

  const [customStart, setCustomStart] = useState(isCustom ? dateRange.start : '')
  const [customEnd, setCustomEnd] = useState(isCustom ? dateRange.end : '')
  const [showCustomPicker, setShowCustomPicker] = useState(isCustom)

  const handleTabClick = (id) => {
    if (id === 'custom') {
      setShowCustomPicker(true)
    } else {
      setShowCustomPicker(false)
      onRangeChange(id)
    }
  }

  const handleApplyCustom = () => {
    if (customStart && customEnd) onRangeChange({ start: customStart, end: customEnd })
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 backdrop-blur-xl border-b"
      style={{ background: 'var(--navbar-bg)', borderBottomColor: 'var(--navbar-bd)' }}
    >
      {/* Left: Logo + filters */}
      <div className="flex items-center gap-5">
        {/* Logo */}
        <img
          src={dejavuLogo}
          alt="Deja Vu Real Estate"
          className="h-32 w-auto object-contain dark:invert -my-8"
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-white/[0.07]" />

        {/* Date tabs */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] p-1 rounded-lg border border-slate-200 dark:border-white/[0.06] gap-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  activeTab === t.id && (t.id !== 'custom' || showCustomPicker)
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {showCustomPicker && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-white/[0.07]">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium border border-slate-300 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 dark:[color-scheme:dark]"
              />
              <span className="text-slate-400 text-xs">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium border border-slate-300 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 dark:[color-scheme:dark]"
              />
              <button
                onClick={handleApplyCustom}
                disabled={!customStart || !customEnd}
                className="px-3 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-30 transition"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Agent dropdown */}
        <div className="relative">
          <select
            value={selectedAgent}
            onChange={e => onAgentChange(e.target.value)}
            className="appearance-none cursor-pointer pl-8 pr-7 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[11px] font-semibold text-slate-600 dark:text-slate-400 outline-none hover:border-blue-400 dark:hover:border-white/20 transition focus:border-blue-500/40"
          >
            {AGENTS.map(a => (
              <option key={a.id} value={a.id} className="bg-white dark:bg-[#0d1424] text-slate-700 dark:text-slate-200">
                {a.label}
              </option>
            ))}
          </select>
          <User size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-white/[0.07]" />

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-600 dark:text-emerald-500 font-semibold tracking-wide">Live</span>
          {lastUpdated && <span className="text-slate-400 hidden sm:block">{format(lastUpdated, 'HH:mm')}</span>}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-yellow-400"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition text-slate-500 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 group"
          title="Refresh data"
        >
          <RefreshCw size={13} className={`transition-transform duration-500 ${loading ? 'animate-spin text-blue-500' : 'group-hover:rotate-90'}`} />
        </button>
      </div>
    </nav>
  )
}
