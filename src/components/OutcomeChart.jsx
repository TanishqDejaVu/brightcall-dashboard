import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6']

export default function OutcomeChart({ data }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Outcome Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 80 }}>
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} width={80} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            cursor={{ fill: '#f1f5f9' }}
          />
          <Bar dataKey="count" radius={[0,4,4,0]} animationDuration={1000} barSize={16}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.9} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
