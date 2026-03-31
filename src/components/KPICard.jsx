function healthColor(value, type) {
  if (type === 'connection_rate') {
    if (value >= 30) return { label: 'Good', color: 'text-emerald-600 bg-emerald-100 text-emerald-700' }
    if (value >= 20) return { label: 'Fair', color: 'text-amber-600 bg-amber-100 text-amber-700' }
    return { label: 'Low', color: 'text-red-600 bg-red-100 text-red-700' }
  }
  return null
}

export default function KPICard({ icon: Icon, label, value, subLabel, colorClass = 'text-slate-900', healthType, delay = 0, breakdown = [] }) {
  const health = healthType ? healthColor(parseFloat(value), healthType) : null

  return (
    <div
      className="group relative card-glow rounded-xl border border-slate-200 bg-white backdrop-blur p-4 flex flex-col gap-2 opacity-0 animate-fade-up transition-all hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Tooltip Breakthrough */}
      {breakdown.length > 0 && (
        <div className="absolute left-0 bottom-full mb-3 w-64 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Status Breakdown</p>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between group/item p-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <span className="text-[11px] font-semibold text-slate-600 truncate">{b.label}</span>
                <span className="text-[11px] font-mono font-bold text-blue-600">{b.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-6 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45 -translate-y-1.5" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 transition group-hover:scale-110">
          <Icon size={16} className={colorClass} />
        </div>
        {health && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${health.color}`}>
            {health.label}
          </span>
        )}
      </div>
      <div>
        <p className={`font-mono text-2xl font-bold ${colorClass} tracking-tight`}>{value}</p>
        <p className="text-xs font-bold text-slate-500 mt-0.5">{label}</p>
        {subLabel && <p className="text-[10px] text-slate-400 mt-0.5 opacity-80">{subLabel}</p>}
      </div>
    </div>
  )
}
