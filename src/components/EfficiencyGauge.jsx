export default function EfficiencyGauge({ data }) {
  const score = Math.min(Math.round((data.leads.leads / (data.summary.totalCalls || 1)) * 1000), 100)
  const label = score >= 8 ? 'Excellent' : score >= 5 ? 'Good' : score >= 3 ? 'Fair' : 'Poor'
  const color = score >= 8 ? '#10b981' : score >= 5 ? '#3b82f6' : score >= 3 ? '#f59e0b' : '#ef4444'

  const r = 52
  const circumference = Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] p-5 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Efficiency Score</h3>
        <p className="text-[11px] text-slate-600 mt-0.5">Leads per 100 calls</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <svg width="130" height="78" viewBox="0 0 130 78">
          {/* Track */}
          <path
            d={`M 13 66 A ${r} ${r} 0 0 1 117 66`}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={`M 13 66 A ${r} ${r} 0 0 1 117 66`}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 5px ${color}70)` }}
          />
          <text x="65" y="61" textAnchor="middle" fill={color} fontSize="20" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {score}
          </text>
        </svg>
        <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
        <span className="text-[10px] text-slate-700 mt-1">leads / calls × 100</span>
      </div>
    </div>
  )
}
