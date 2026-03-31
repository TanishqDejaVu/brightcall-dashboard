export default function EfficiencyGauge({ data }) {
  const score = Math.min(Math.round((data.leads.leads / (data.summary.totalCalls || 1)) * 1000), 100)
  const label = score >= 8 ? 'Excellent' : score >= 5 ? 'Good' : score >= 3 ? 'Fair' : 'Poor'
  const color = score >= 8 ? '#10b981' : score >= 5 ? '#3b82f6' : score >= 3 ? '#f59e0b' : '#ef4444'

  const r = 52
  const circumference = Math.PI * r // semicircle
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur p-5 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 self-start">Outcome Efficiency</h3>
      <svg width="128" height="72" viewBox="0 0 128 72">
        <path d={`M 12 64 A ${r} ${r} 0 0 1 116 64`} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
        <path
          d={`M 12 64 A ${r} ${r} 0 0 1 116 64`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="64" y="58" textAnchor="middle" fill={color} fontSize="18" fontWeight="700">{score}</text>
      </svg>
      <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
      <span className="text-[10px] text-slate-400 mt-0.5">Leads / Total Calls x 100</span>
    </div>
  )
}
