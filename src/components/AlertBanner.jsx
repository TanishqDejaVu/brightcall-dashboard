import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react'
import { useState } from 'react'

function buildAlerts(data) {
  const alerts = []
  const { summary, quality, leads } = data
  const total = summary.totalCalls || 1

  if (quality.shortPct > 60)
    alerts.push({ type: 'warn', msg: `${quality.shortPct}% of calls lasted under 10s — review your opening script` })
  else if (quality.shortPct > 40)
    alerts.push({ type: 'info', msg: `${quality.shortPct}% of calls are short (<10s) — aim to engage leads longer` })

  if (summary.connectionRate < 18)
    alerts.push({ type: 'warn', msg: `Connection rate is ${summary.connectionRate}% — consider calling between 10am–12pm` })
  else if (summary.connectionRate >= 25)
    alerts.push({ type: 'good', msg: `Strong connection rate at ${summary.connectionRate}% — keep it up` })

  if (leads.leads > 0)
    alerts.push({ type: 'good', msg: `${leads.leads} lead${leads.leads > 1 ? 's' : ''} qualified this period (${leads.appt} appt · ${leads.qualified} qualified)` })

  if (leads.leadQualPct < 2 && total > 100)
    alerts.push({ type: 'warn', msg: `Lead qualification at ${leads.leadQualPct}% — focus on meaningful conversations` })

  return alerts.slice(0, 3)
}

const ICON = { warn: AlertTriangle, info: Info, good: CheckCircle2 }
const STYLE = {
  warn: 'bg-amber-50 dark:bg-amber-500/[0.07] text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  info: 'bg-blue-50 dark:bg-blue-500/[0.07] text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  good: 'bg-emerald-50 dark:bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
}

export default function AlertBanner({ data }) {
  const [dismissed, setDismissed] = useState([])
  const alerts = buildAlerts(data).filter((_, i) => !dismissed.includes(i))
  if (!alerts.length) return null

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a, i) => {
        const Ic = ICON[a.type]
        return (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] ${STYLE[a.type]}`}>
            <Ic size={14} className="flex-shrink-0 opacity-80" />
            <span className="flex-1">{a.msg}</span>
            <button
              onClick={() => setDismissed(d => [...d, i])}
              className="opacity-40 hover:opacity-80 transition p-0.5 flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
