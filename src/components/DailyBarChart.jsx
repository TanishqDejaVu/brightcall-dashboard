import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function DailyBarChart({ data }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Daily Call Volume</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: 4 }} itemStyle={{ color: '#0f172a', fontWeight: 500 }}
            cursor={{ fill: '#f1f5f9' }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 10 }} />
          <Bar dataKey="totalCalls" name="Total Calls" fill="url(#barGrad)" radius={[4,4,0,0]} animationDuration={1000} />
          <Line type="monotone" dataKey="answeredCalls" name="Answered" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={1000} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
