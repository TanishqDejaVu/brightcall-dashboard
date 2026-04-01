import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'

export default function HourlyAreaChart({ data }) {
  const peak = data.reduce((p, c) => c.callCount > p.callCount ? c : p, data[0])

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-200">Calls by Hour</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Hourly distribution across all days</p>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 14, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
            labelStyle={{ color: '#94a3b8', fontWeight: '600', marginBottom: 6 }}
            itemStyle={{ color: '#cbd5e1', fontWeight: 500 }}
          />
          <Area type="monotone" dataKey="callCount" name="Calls" stroke="#3b82f6" fill="url(#hourGrad)" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }} dot={false} animationDuration={1000} />
          {peak && (
            <ReferenceDot
              x={peak.label} y={peak.callCount} r={5}
              fill="#f59e0b" stroke="#070b14" strokeWidth={2}
              label={{ value: `Peak: ${peak.callCount}`, position: 'top', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
