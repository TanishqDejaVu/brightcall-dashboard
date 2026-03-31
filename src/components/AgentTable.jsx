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
  const cls = pct >= 5 ? 'text-emerald-600 bg-emerald-100 text-emerald-700' : pct >= 2 ? 'text-amber-600 bg-amber-100 text-amber-700' : 'text-red-600 bg-red-100 text-red-700'
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{pct}%</span>
}

export default function AgentTable({ agents }) {
  const [sort, setSort] = useState({ col: 'callsMade', dir: 'desc' })
  const sorted = sortData(agents, sort.col, sort.dir)

  const th = (col, label, align = 'left') => {
    const active = sort.col === col
    const Icon = sort.dir === 'asc' ? ChevronUp : ChevronDown
    return (
      <th className={`px-3 py-2.5 text-${align} text-[10px] text-slate-400 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-700 transition select-none whitespace-nowrap`}
          onClick={() => setSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))}>
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {label}
          {active && <Icon size={10} />}
        </span>
      </th>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white backdrop-blur overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-800">Agent Leaderboard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider w-12">#</th>
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
              <tr key={a.agentName} className="border-b border-slate-100 hover:bg-slate-50/80 transition">
                <td className="px-4 py-2.5 text-center">
                  {i === 0 ? <Trophy size={14} className="text-amber-600 inline" /> : <span className="text-slate-400 font-mono text-xs">{i + 1}</span>}
                </td>
                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{a.agentName}</td>
                <td className="px-3 py-2.5 font-mono text-slate-700 text-right">{a.callsMade.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-slate-700 text-right">{a.connected.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-slate-700 text-right">{a.appointments}</td>
                <td className="px-3 py-2.5 font-mono text-slate-700 text-right">{a.avgTalkTime}s</td>
                <td className="px-3 py-2.5 text-right"><LeadBadge pct={a.leadQualPct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
