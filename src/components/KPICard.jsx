function healthColor(value, type) {
  if (type === 'connection_rate') {
    if (value >= 30) return { label: 'Good', color: 'text-emerald-600 bg-emerald-100 text-emerald-700' }
    if (value >= 20) return { label: 'Fair', color: 'text-amber-600 bg-amber-100 text-amber-700' }
    return { label: 'Low', color: 'text-red-600 bg-red-100 text-red-700' }
  }
  return null
}

export default function KPICard({ icon: Icon, label, value, subLabel, colorClass = 'text-slate-900', healthType, delay = 0 }) {
  const health = healthType ? healthColor(parseFloat(value), healthType) : null

  return (
    <div
      className="card-glow rounded-xl border border-slate-200 bg-white backdrop-blur p-4 flex flex-col gap-2 opacity-0 animate-fade-up transition"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-white">
          <Icon size={16} className={colorClass} />
        </div>
        {health && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${health.color}`}>
            {health.label}
          </span>
        )}
      </div>
      <div>
        <p className={`font-mono text-2xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        {subLabel && <p className="text-[11px] text-slate-300 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  )
}
