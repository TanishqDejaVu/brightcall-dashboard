import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'

function chartColors(isDark) {
  return {
    axis:    isDark ? '#64748b' : '#94a3b8',
    grid:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    ttBg:    isDark ? '#0d1424' : '#ffffff',
    ttBd:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    ttShadow:isDark ? '0 20px 50px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
    ttLabel: isDark ? '#94a3b8' : '#64748b',
    ttItem:  isDark ? '#cbd5e1' : '#0f172a',
    refDotStroke: isDark ? '#070b14' : '#f1f5f9',
  }
}

export default function HourlyAreaChart({ data, isDark }) {
  const c = chartColors(isDark)
  const peak = data.reduce((p, cur) => cur.callCount > p.callCount ? cur : p, data[0])

  return (
    <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Calls by Hour</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hourly distribution across all days</p>
      </div>
      <div className="h-[140px] sm:h-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDark ? 0.25 : 0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fill: c.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: c.ttBg, border: `1px solid ${c.ttBd}`, borderRadius: 12, fontSize: 12, boxShadow: c.ttShadow }}
            labelStyle={{ color: c.ttLabel, fontWeight: '600', marginBottom: 6 }}
            itemStyle={{ color: c.ttItem, fontWeight: 500 }}
          />
          <Area type="monotone" dataKey="callCount" name="Calls" stroke="#3b82f6" fill="url(#hourGrad)" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }} dot={false} animationDuration={1000} />
          {peak && (
            <ReferenceDot
              x={peak.label} y={peak.callCount} r={5}
              fill="#f59e0b" stroke={c.refDotStroke} strokeWidth={2}
              label={{ value: `Peak: ${peak.callCount}`, position: 'top', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
