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

  if (leads.appt > 0)
    alerts.push({ type: 'good', msg: `${leads.appt} appointment${leads.appt > 1 ? 's' : ''} booked this period` })

  if (leads.leadQualPct < 2 && total > 100)
    alerts.push({ type: 'warn', msg: `Lead qualification at ${leads.leadQualPct}% — focus on meaningful conversations` })

  return alerts.slice(0, 3)
}

const ICON = { warn: AlertTriangle, info: Info, good: CheckCircle2 }
const STYLE = {
  warn: 'bg-amber-100 text-amber-700 border-amber-400/30 text-amber-300',
  info: 'bg-blue-400/10 border-blue-400/30 text-blue-300',
  good: 'bg-emerald-100 text-emerald-700 border-emerald-400/30 text-emerald-300',
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
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${STYLE[a.type]}`}>
            <Ic size={15} className="flex-shrink-0" />
            <span className="flex-1">{a.msg}</span>
            <button onClick={() => setDismissed(d => [...d, i])} className="opacity-50 hover:opacity-100 transition">
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
