import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function QualityDonut({ quality, total }) {
  const data = [
    { name: 'Short (<10s)', value: quality.short, color: '#ef4444' },
    { name: 'Medium (10-30s)', value: quality.medium, color: '#f59e0b' },
    { name: 'Meaningful (>30s)', value: quality.meaningful, color: '#10b981' },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Call Quality</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3} animationDuration={1000}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-mono text-xl font-bold text-slate-900">{total.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">total calls</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />
              <span className="text-slate-500">{d.name}</span>
            </div>
            <span className="font-mono text-slate-700">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
