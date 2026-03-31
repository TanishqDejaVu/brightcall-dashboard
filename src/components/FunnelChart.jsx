const STEPS = [
  { key: 'totalCalls', label: 'Total Calls', color: '#3b82f6' },
  { key: 'answeredCalls', label: 'Answered', color: '#6366f1' },
  { key: 'meaningful', label: 'Meaningful', color: '#8b5cf6' },
  { key: 'followUp', label: 'Follow Up', color: '#10b981' },
  { key: 'appt', label: 'Appointment', color: '#f59e0b' },
]

export default function FunnelChart({ data }) {
  const values = {
    totalCalls: data.summary.totalCalls,
    answeredCalls: data.summary.answeredCalls,
    meaningful: data.quality.meaningful,
    followUp: data.leads.followUp,
    appt: data.leads.appt,
  }
  const max = values.totalCalls || 1

  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Conversion Funnel</h3>
      <div className="flex items-end gap-1">
        {STEPS.map((step, i) => {
          const val = values[step.key]
          const prev = i > 0 ? values[STEPS[i - 1].key] : val
          const drop = prev > 0 ? Math.round((1 - val / prev) * 100) : 0
          const pct = Math.round(val / max * 100)
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
              {i > 0 && (
                <span className="text-[10px] text-red-600 font-mono mb-1">-{drop}%</span>
              )}
              <div className="w-full rounded-t-md transition-all duration-500 hover:opacity-100 hover:-translate-y-1 cursor-pointer" style={{ height: `${Math.max(pct * 1.2, 8)}px`, background: `linear-gradient(to top, ${step.color}aa, ${step.color})`, opacity: 0.85, boxShadow: `0 4px 12px ${step.color}33` }} />
              <p className="font-mono text-sm font-bold text-slate-900 mt-1">{val.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 text-center leading-tight">{step.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
