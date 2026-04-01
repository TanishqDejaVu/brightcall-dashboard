import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6']

export default function OutcomeChart({ data }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-200">Outcome Distribution</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Call results breakdown</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 80 }}>
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} width={80} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
            itemStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="count" radius={[0,6,6,0]} animationDuration={1000} barSize={14}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
