const STEPS = [
  { key: 'totalCalls',    label: 'Total Calls',  color: '#3b82f6' },
  { key: 'answeredCalls', label: 'Answered',      color: '#6366f1' },
  { key: 'meaningful',    label: 'Meaningful',    color: '#8b5cf6' },
  { key: 'followUp',      label: 'Follow Up',     color: '#10b981' },
  { key: 'appt',          label: 'Appointment',   color: '#f59e0b' },
]

export default function FunnelChart({ data }) {
  const values = {
    totalCalls:    data.summary.totalCalls,
    answeredCalls: data.summary.answeredCalls,
    meaningful:    data.quality.meaningful,
    followUp:      data.leads.followUp,
    appt:          data.leads.appt,
  }
  const max = values.totalCalls || 1

  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Conversion Funnel</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Lead progression through stages</p>
      </div>
      <div className="flex items-end gap-2">
        {STEPS.map((step, i) => {
          const val = values[step.key]
          const prev = i > 0 ? values[STEPS[i - 1].key] : val
          const drop = prev > 0 ? Math.round((1 - val / prev) * 100) : 0
          const pct = Math.round(val / max * 100)
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1 group">
              {i > 0 && (
                <span className="text-[10px] text-red-500/70 font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  -{drop}%
                </span>
              )}
              <div
                className="w-full rounded-t-lg transition-all duration-500 hover:-translate-y-1 cursor-pointer relative overflow-hidden"
                style={{
                  height: `${Math.max(pct * 1.2, 14)}px`,
                  background: `linear-gradient(to top, ${step.color}30, ${step.color}80)`,
                  border: `1px solid ${step.color}25`,
                  borderBottom: 'none',
                  boxShadow: `0 0 20px ${step.color}15`,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: step.color, opacity: 0.5 }} />
              </div>
              <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">{val.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">{step.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
