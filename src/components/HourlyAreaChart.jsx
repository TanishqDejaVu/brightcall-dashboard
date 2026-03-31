import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'

export default function HourlyAreaChart({ data }) {
  const peak = data.reduce((p, c) => c.callCount > p.callCount ? c : p, data[0])

  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Call Volume by Hour</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: 4 }} itemStyle={{ color: '#0f172a', fontWeight: 500 }}
          />
          <Area type="monotone" dataKey="callCount" name="Calls" stroke="#3b82f6" fill="url(#hourGrad)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} dot={false} animationDuration={1000} />
          {peak && <ReferenceDot x={peak.label} y={peak.callCount} r={6} fill="#f59e0b" stroke="#ffffff" strokeWidth={3} label={{ value: `Peak: ${peak.callCount}`, position: 'top', fill: '#f59e0b', fontSize: 11, fontWeight: 'bold' }} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
