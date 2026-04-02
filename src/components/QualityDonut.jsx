import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function QualityDonut({ quality, total, isDark }) {
  const data = [
    { name: 'Short (<10s)', value: quality.short, color: '#ef4444' },
    { name: 'Medium (10-30s)', value: quality.medium, color: '#f59e0b' },
    { name: 'Meaningful (>30s)', value: quality.meaningful, color: '#10b981' },
  ]
  const meaningfulPct = total > 0 ? Math.round((quality.meaningful / total) * 100) : 0

  const ttBg     = isDark ? '#0d1424' : '#ffffff'
  const ttBd     = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ttShadow = isDark ? '0 20px 50px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)'
  const ttItem   = isDark ? '#cbd5e1' : '#0f172a'

  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Call Quality</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Duration quality distribution</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={170} minWidth={0}>
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius={52} outerRadius={76}
              dataKey="value" paddingAngle={3}
              animationDuration={1000} strokeWidth={0}
            >
              {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: ttBg, border: `1px solid ${ttBd}`, borderRadius: 12, fontSize: 12, boxShadow: ttShadow }}
              itemStyle={{ color: ttItem, fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">{meaningfulPct}%</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">meaningful</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[11px] text-slate-500 dark:text-slate-500">{d.name}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
