function healthColor(value, type) {
  if (type === 'connection_rate') {
    if (value >= 30) return { label: 'Good', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20' }
    if (value >= 20) return { label: 'Fair', color: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20' }
    return { label: 'Low', color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20' }
  }
  return null
}

function extractAccent(colorClass) {
  if (colorClass.includes('emerald')) return '#10b981'
  if (colorClass.includes('red'))     return '#ef4444'
  if (colorClass.includes('blue'))    return '#3b82f6'
  if (colorClass.includes('purple'))  return '#a855f7'
  if (colorClass.includes('indigo'))  return '#6366f1'
  if (colorClass.includes('teal'))    return '#14b8a6'
  if (colorClass.includes('amber'))   return '#f59e0b'
  if (colorClass.includes('cyan'))    return '#06b6d4'
  return '#64748b'
}

export default function KPICard({ icon: Icon, label, value, subLabel, colorClass = 'text-blue-400', healthType, delay = 0, breakdown = [] }) {
  const health = healthType ? healthColor(parseFloat(value), healthType) : null
  const accent = extractAccent(colorClass)

  return (
    <div
      className="group relative card-glow rounded-2xl bg-[var(--bg-card)] border border-[var(--bd-card)] p-4 flex flex-col gap-3 opacity-0 animate-fade-up transition-all duration-300 hover:-translate-y-0.5 overflow-hidden cursor-default"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Colored top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}cc, transparent)` }}
      />

      {/* Breakdown tooltip */}
      {breakdown.length > 0 && (
        <div className="absolute left-0 bottom-full mb-3 w-64 p-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--bd-card)] shadow-xl shadow-black/20 dark:shadow-black/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] translate-y-2 group-hover:translate-y-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 border-b border-slate-200 dark:border-white/[0.05] pb-2">
            Status Breakdown
          </p>
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto custom-scrollbar">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] transition">
                <span className="text-[11px] text-slate-500 dark:text-slate-500 truncate pr-2">{b.label}</span>
                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">{b.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-6 w-2.5 h-2.5 bg-[var(--bg-card)] border-b border-r border-[var(--bd-card)] rotate-45 -translate-y-1.5" />
        </div>
      )}

      {/* Icon + health badge */}
      <div className="flex items-center justify-between">
        <div
          className="p-2 rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${accent}18` }}
        >
          <Icon size={14} style={{ color: accent }} />
        </div>
        {health && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${health.color}`}>
            {health.label}
          </span>
        )}
      </div>

      {/* Value + labels */}
      <div>
        <p className="font-mono text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{value}</p>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 leading-none">{label}</p>
        {subLabel && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-none">{subLabel}</p>}
      </div>
    </div>
  )
}
