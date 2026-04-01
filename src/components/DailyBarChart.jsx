import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function DailyBarChart({ data }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] p-5 h-full">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-200">Daily Call Volume</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Total vs answered calls per day</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
            labelStyle={{ color: '#94a3b8', fontWeight: '600', marginBottom: 6 }}
            itemStyle={{ color: '#cbd5e1', fontWeight: 500 }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 12 }} />
          <Bar dataKey="totalCalls" name="Total Calls" fill="url(#barGrad)" radius={[4,4,0,0]} animationDuration={1000} />
          <Line type="monotone" dataKey="answeredCalls" name="Answered" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1000} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
