import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function QualityDonut({ quality, total }) {
  const data = [
    { name: 'Short (<10s)', value: quality.short, color: '#ef4444' },
    { name: 'Medium (10-30s)', value: quality.medium, color: '#f59e0b' },
    { name: 'Meaningful (>30s)', value: quality.meaningful, color: '#10b981' },
  ]
  const meaningfulPct = total > 0 ? Math.round((quality.meaningful / total) * 100) : 0

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Call Quality</h3>
        <p className="text-[11px] text-slate-600 mt-0.5">Duration quality distribution</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={170}>
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
              contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
              itemStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-mono text-2xl font-bold text-slate-100">{meaningfulPct}%</p>
          <p className="text-[10px] text-slate-600 mt-0.5">meaningful</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/[0.04]">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[11px] text-slate-500">{d.name}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
