import { useState } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function cellStyle(v, maxVal) {
  const pct = v / maxVal
  if (pct === 0) return { background: 'rgba(255,255,255,0.03)' }
  // Blue → cyan gradient as intensity increases
  const opacity = 0.12 + pct * 0.88
  const r = Math.round(30 + pct * 20)
  const g = Math.round(100 + pct * 80)
  const b = Math.round(240 - pct * 40)
  return {
    background: `rgba(${r},${g},${b},${opacity})`,
    boxShadow: pct > 0.65 ? `0 0 8px rgba(59,130,246,${pct * 0.35})` : 'none',
  }
}

export default function HeatmapGrid({ heatmap }) {
  const maxVal = Math.max(...heatmap.flat(), 1)
  const [tooltip, setTooltip] = useState(null)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Activity Heatmap</h3>
        <p className="text-[11px] text-slate-600 mt-0.5">Call volume intensity by day and hour</p>
      </div>
      <div className="overflow-x-auto">
        {/* Hour labels */}
        <div className="flex gap-1 mb-1.5 ml-10">
          {HOURS.map(h => (
            <div key={h} className="w-5 text-center text-[8px] text-slate-700 flex-shrink-0">
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {heatmap.map((row, di) => (
          <div key={di} className="flex items-center gap-1 mb-1">
            <div className="w-9 text-[9px] text-slate-600 text-right pr-1.5 flex-shrink-0 font-medium">
              {DAY_LABELS[di]}
            </div>
            {row.map((val, hi) => (
              <div
                key={hi}
                className="w-5 h-5 rounded flex-shrink-0 cursor-pointer transition-transform hover:scale-125"
                style={cellStyle(val, maxVal)}
                onMouseEnter={() => setTooltip({ day: DAY_LABELS[di], hour: hi, val })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend + tooltip readout */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
        <span className="text-[10px] text-slate-700">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(p => (
          <div
            key={p}
            className="w-3.5 h-3.5 rounded"
            style={p === 0 ? { background: 'rgba(255,255,255,0.04)' } : cellStyle(p * maxVal, maxVal)}
          />
        ))}
        <span className="text-[10px] text-slate-700">More</span>
        {tooltip && (
          <span className="ml-auto text-[11px] text-slate-600">
            {tooltip.day} {String(tooltip.hour).padStart(2,'0')}:00
            {' '}—{' '}
            <span className="text-slate-300 font-mono font-semibold">{tooltip.val} calls</span>
          </span>
        )}
      </div>
    </div>
  )
}
