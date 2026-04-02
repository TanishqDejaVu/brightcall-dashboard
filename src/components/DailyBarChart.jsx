import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

function chartColors(isDark) {
  return {
    axis:    isDark ? '#64748b' : '#94a3b8',
    grid:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    cursor:  isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    legend:  isDark ? '#64748b' : '#94a3b8',
    ttBg:    isDark ? '#0d1424' : '#ffffff',
    ttBd:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    ttShadow:isDark ? '0 20px 50px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
    ttLabel: isDark ? '#94a3b8' : '#64748b',
    ttItem:  isDark ? '#cbd5e1' : '#0f172a',
  }
}

export default function DailyBarChart({ data, isDark }) {
  const c = chartColors(isDark)
  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5 h-full">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Daily Call Volume</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Total vs answered calls per day</p>
      </div>
      <div className="h-[150px] sm:h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={isDark ? 0.7 : 0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={isDark ? 0.1 : 0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: c.axis, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fill: c.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: c.ttBg, border: `1px solid ${c.ttBd}`, borderRadius: 12, fontSize: 12, boxShadow: c.ttShadow }}
            labelStyle={{ color: c.ttLabel, fontWeight: '600', marginBottom: 6 }}
            itemStyle={{ color: c.ttItem, fontWeight: 500 }}
            cursor={{ fill: c.cursor }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: c.legend, paddingTop: 12 }} />
          <Bar dataKey="totalCalls" name="Total Calls" fill="url(#barGrad)" radius={[4,4,0,0]} animationDuration={1000} />
          <Line type="monotone" dataKey="answeredCalls" name="Answered" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1000} />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
