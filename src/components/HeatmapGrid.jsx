import { useState } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HeatmapGrid({ heatmap }) {
  const maxVal = Math.max(...heatmap.flat(), 1)
  const [tooltip, setTooltip] = useState(null)

  function intensity(v) {
    const pct = v / maxVal
    if (pct === 0) return 'bg-white'
    if (pct < 0.2) return 'bg-blue-900/40'
    if (pct < 0.4) return 'bg-blue-700/50'
    if (pct < 0.6) return 'bg-blue-600/70'
    if (pct < 0.8) return 'bg-blue-600/80'
    return 'bg-blue-400'
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-100 backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Call Volume Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 mb-1 ml-10">
          {HOURS.map(h => (
            <div key={h} className="w-5 text-center text-[8px] text-slate-300 flex-shrink-0">{h % 3 === 0 ? h : ''}</div>
          ))}
        </div>
        {heatmap.map((row, di) => (
          <div key={di} className="flex items-center gap-1 mb-0.5">
            <div className="w-9 text-[9px] text-slate-400 text-right pr-1 flex-shrink-0">{DAY_LABELS[di]}</div>
            {row.map((val, hi) => (
              <div
                key={hi}
                className={`w-5 h-5 rounded-sm flex-shrink-0 cursor-pointer transition-transform hover:scale-125 ${intensity(val)}`}
                onMouseEnter={() => setTooltip({ day: DAY_LABELS[di], hour: hi, val })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>
      {tooltip && (
        <div className="mt-2 text-xs text-slate-500 text-center">
          {tooltip.day} {String(tooltip.hour).padStart(2,'0')}:00 — <span className="text-slate-900 font-mono">{tooltip.val} calls</span>
        </div>
      )}
    </div>
  )
}
