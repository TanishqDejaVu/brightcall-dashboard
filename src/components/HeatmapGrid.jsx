import { useState } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function cellStyle(v, maxVal, isDark) {
  const pct = v / maxVal
  if (pct === 0) return { background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)' }
  const opacity = isDark ? 0.12 + pct * 0.88 : 0.15 + pct * 0.75
  const r = Math.round(isDark ? 30 + pct * 20 : 37 + pct * 22)
  const g = Math.round(isDark ? 100 + pct * 80 : 99 + pct * 31)
  const b = Math.round(isDark ? 240 - pct * 40 : 235 - pct * 15)
  return {
    background: `rgba(${r},${g},${b},${opacity})`,
    boxShadow: pct > 0.65 ? `0 0 6px rgba(59,130,246,${pct * 0.3})` : 'none',
  }
}

export default function HeatmapGrid({ heatmap, isDark }) {
  const maxVal = Math.max(...heatmap.flat(), 1)
  const [tooltip, setTooltip] = useState(null)

  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Activity Heatmap</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Call volume intensity by day and hour</p>
      </div>
      <div className="overflow-x-auto">
        {/* Hour labels */}
        <div className="flex gap-1 mb-1.5 ml-7 sm:ml-10">
          {HOURS.map(h => (
            <div key={h} className="w-3.5 sm:w-5 text-center text-[8px] text-slate-400 dark:text-slate-500 flex-shrink-0">
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {heatmap.map((row, di) => (
          <div key={di} className="flex items-center gap-1 mb-1">
            <div className="w-7 sm:w-9 text-[9px] text-slate-500 dark:text-slate-400 text-right pr-1.5 flex-shrink-0 font-medium">
              {DAY_LABELS[di]}
            </div>
            {row.map((val, hi) => (
              <div
                key={hi}
                className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded flex-shrink-0 cursor-pointer transition-transform hover:scale-125"
                style={cellStyle(val, maxVal, isDark)}
                onMouseEnter={() => setTooltip({ day: DAY_LABELS[di], hour: hi, val })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend + tooltip readout */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(p => (
          <div key={p} className="w-3.5 h-3.5 rounded" style={cellStyle(p * maxVal, maxVal, isDark)} />
        ))}
        <span className="text-[10px] text-slate-400 dark:text-slate-500">More</span>
        {tooltip && (
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
            {tooltip.day} {String(tooltip.hour).padStart(2,'0')}:00
            {' '}—{' '}
            <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold">{tooltip.val} calls</span>
          </span>
        )}
      </div>
    </div>
  )
}
