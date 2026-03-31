import { useState } from 'react'
import { RefreshCw, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

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
  { id: '827915', label: 'Telesales 5' },
]

export default function Navbar({ dateRange, selectedAgent, onRangeChange, onAgentChange, onRefresh, loading, lastUpdated }) {
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
    if (customStart && customEnd) {
      onRangeChange({ start: customStart, end: customEnd })
    }
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-8">
        <span className="font-mono font-bold text-lg text-blue-600 tracking-tight">Brightcall</span>

        {/* TradingView Style Date filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === t.id && (t.id !== 'custom' || showCustomPicker)
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {showCustomPicker && (
            <div className="flex items-center gap-2 animate-fade-in pl-2 border-l border-slate-200">
              <input 
                type="date" 
                value={customStart} 
                onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={handleApplyCustom}
                disabled={!customStart || !customEnd}
                className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        
        {/* Agent Filter Dropdown */}
        <div className="relative group">
          <select 
            value={selectedAgent}
            onChange={e => onAgentChange(e.target.value)}
            className="appearance-none cursor-pointer flex items-center gap-2 pl-8 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none hover:border-blue-500 transition"
          >
            {AGENTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="text-emerald-600 font-bold tracking-wide">LIVE</span>
          {lastUpdated && <span className="text-slate-500">Updated {format(lastUpdated, 'HH:mm')}</span>}
        </div>
        
        <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-blue-600" title="Refresh Data">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </nav>
  )
}
