import { useState } from 'react'
import { ChevronUp, ChevronDown, Trophy } from 'lucide-react'

function sortData(data, col, dir) {
  return [...data].sort((a, b) => {
    const av = a[col], bv = b[col]
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return dir === 'asc' ? av - bv : bv - av
  })
}

function LeadBadge({ pct }) {
  const cls = pct >= 5
    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    : pct >= 2
    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
    : 'text-red-400 bg-red-500/10 border border-red-500/20'
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{pct}%</span>
}

function RankMedal({ rank }) {
  if (rank === 0) return <Trophy size={13} className="text-amber-400 inline-block" />
  if (rank === 1) return <span className="text-[11px] font-bold text-slate-500">2</span>
  if (rank === 2) return <span className="text-[11px] font-bold text-slate-500">3</span>
  return <span className="text-[11px] font-mono text-slate-500">{rank + 1}</span>
}

function Initials({ name }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
      {letters}
    </div>
  )
}

export default function AgentTable({ agents }) {
  const [sort, setSort] = useState({ col: 'callsMade', dir: 'desc' })
  const sorted = sortData(agents, sort.col, sort.dir)

  const th = (col, label, align = 'left') => {
    const active = sort.col === col
    const Icon = sort.dir === 'asc' ? ChevronUp : ChevronDown
    return (
      <th
        className={`px-4 py-3 text-${align} text-[10px] text-slate-500 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-400 transition select-none whitespace-nowrap`}
        onClick={() => setSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))}
      >
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {label}
          {active && <Icon size={9} className="text-blue-500" />}
        </span>
      </th>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1424] overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-slate-200">Agent Leaderboard</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Ranked by performance metrics</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider w-12">#</th>
              {th('agentName', 'Agent')}
              {th('callsMade', 'Calls', 'right')}
              {th('connected', 'Connected', 'right')}
              {th('appointments', 'Appt', 'right')}
              {th('avgTalkTime', 'Avg Talk', 'right')}
              {th('leadQualPct', 'Lead %', 'right')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={a.agentName} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                <td className="px-4 py-3.5 text-center">
                  <RankMedal rank={i} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Initials name={a.agentName} />
                    <span className="font-semibold text-slate-300 text-[13px] whitespace-nowrap">{a.agentName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-right text-[13px]">{a.callsMade.toLocaleString()}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-right text-[13px]">{a.connected.toLocaleString()}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-right text-[13px]">{a.appointments}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-right text-[13px]">{a.avgTalkTime}s</td>
                <td className="px-4 py-3.5 text-right"><LeadBadge pct={a.leadQualPct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
