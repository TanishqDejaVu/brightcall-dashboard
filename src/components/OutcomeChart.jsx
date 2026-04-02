const COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1',
]

export default function OutcomeChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const max   = Math.max(...data.map(d => d.count))
  const sorted = [...data].sort((a, b) => b.count - a.count)

  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Outcome Distribution</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Call results breakdown · {total.toLocaleString()} total</p>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[260px] pr-1">
        {sorted.map((item, i) => {
          const pct = total ? ((item.count / total) * 100).toFixed(1) : 0
          const barW = max ? (item.count / max) * 100 : 0
          const color = COLORS[i % COLORS.length]
          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{pct}%</span>
                  <span className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300 w-10 text-right">{item.count.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barW}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
