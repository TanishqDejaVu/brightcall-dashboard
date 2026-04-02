import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'

function CustomTooltip({ active, payload, label, c }) {
  if (!active || !payload?.length) return null
  const get = key => payload.find(p => p.dataKey === key)?.value ?? 0
  return (
    <div style={{ background: c.ttBg, border: `1px solid ${c.ttBd}`, borderRadius: 12, fontSize: 12, boxShadow: c.ttShadow, padding: '10px 14px' }}>
      <p style={{ color: c.ttLabel, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ color: '#3b82f6', fontWeight: 500 }}>Total : {get('callCount')}</p>
      <p style={{ color: '#10b981', fontWeight: 500 }}>Answered : {get('answered')}</p>
      <p style={{ color: '#f87171', fontWeight: 500 }}>Unanswered : {get('unanswered')}</p>
    </div>
  )
}

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
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Calls by Hour</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hourly distribution across all days</p>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          {[['#3b82f6', 'Total'], ['#10b981', 'Answered'], ['#f87171', 'Unanswered']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-[140px] sm:h-[190px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
          <Tooltip content={<CustomTooltip c={c} />} />
          <Area type="monotone" dataKey="callCount" name="Total" stroke="#3b82f6" fill="url(#hourGrad)" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }} dot={false} animationDuration={1000} />
          <Area type="monotone" dataKey="answered" name="Answered" stroke="#10b981" fill="none" strokeWidth={1.5} dot={false} animationDuration={1000} />
          <Area type="monotone" dataKey="unanswered" name="Unanswered" stroke="#f87171" fill="none" strokeWidth={1.5} dot={false} animationDuration={1000} />
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
