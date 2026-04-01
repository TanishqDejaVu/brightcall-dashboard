import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6']

function chartColors(isDark) {
  return {
    axis:    isDark ? '#64748b' : '#94a3b8',
    yAxis:   isDark ? '#64748b' : '#64748b',
    cursor:  isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    ttBg:    isDark ? '#0d1424' : '#ffffff',
    ttBd:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    ttShadow:isDark ? '0 20px 50px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
    ttItem:  isDark ? '#cbd5e1' : '#0f172a',
  }
}

export default function OutcomeChart({ data, isDark }) {
  const c = chartColors(isDark)
  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Outcome Distribution</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Call results breakdown</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 80 }}>
          <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: c.yAxis, fontSize: 10, fontWeight: 500 }} width={80} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: c.ttBg, border: `1px solid ${c.ttBd}`, borderRadius: 12, fontSize: 12, boxShadow: c.ttShadow }}
            itemStyle={{ color: c.ttItem, fontWeight: 'bold' }}
            cursor={{ fill: c.cursor }}
          />
          <Bar dataKey="count" radius={[0,6,6,0]} animationDuration={1000} barSize={14}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
