import { useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import Navbar from '../components/Navbar'
import KPICard from '../components/KPICard'
import AlertBanner from '../components/AlertBanner'
import FunnelChart from '../components/FunnelChart'
import DailyBarChart from '../components/DailyBarChart'
import OutcomeChart from '../components/OutcomeChart'
import QualityDonut from '../components/QualityDonut'
import HourlyAreaChart from '../components/HourlyAreaChart'
import AgentTable from '../components/AgentTable'
import HeatmapGrid from '../components/HeatmapGrid'
import EfficiencyGauge from '../components/EfficiencyGauge'
import SkeletonCard from '../components/SkeletonCard'
import { Phone, PhoneCall, TrendingUp, Clock, Timer, Activity, UserCheck, CalendarCheck, Target, PhoneOff, Repeat, BarChart2 } from 'lucide-react'

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('1w')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const { data, loading, refreshing, progress, error, lastUpdated, refetch } = useDashboard(dateRange, selectedAgent)

  const kpi1 = data ? [
    { icon: PhoneCall, label: 'Answered', value: data.summary.answeredCalls.toLocaleString(), colorClass: 'text-emerald-600', subLabel: 'Connected Calls', breakdown: data.breakdowns.answered },
    { icon: PhoneOff, label: 'Unanswered', value: (data.summary.totalCalls - data.summary.answeredCalls).toLocaleString(), colorClass: 'text-red-600', subLabel: 'Missed/Lost', breakdown: data.breakdowns.unanswered },
    { icon: Phone, label: 'Total Calls', value: data.summary.totalCalls.toLocaleString(), colorClass: 'text-blue-600', subLabel: 'Total Attempts' },
    { icon: TrendingUp, label: 'Conn. Rate', value: data.summary.connectionRate + '%', colorClass: data.summary.connectionRate >= 25 ? 'text-emerald-600' : 'text-amber-600', healthType: 'connection_rate', subLabel: 'Answer rate' },
    { icon: Target, label: 'Lead Qual %', value: data.leads.leadQualPct + '%', colorClass: 'text-purple-600', subLabel: 'Of total calls' },
    { icon: Clock, label: 'Avg Talk Time', value: data.summary.avgTalkTimeFmt, colorClass: 'text-indigo-600', subLabel: 'Per call' },
  ] : []

  const kpi2 = data ? [
    { icon: CalendarCheck, label: 'Appointments', value: data.leads.appt.toLocaleString(), colorClass: 'text-blue-600', subLabel: data.leads.leads + ' total qualified' },
    { icon: UserCheck, label: 'Follow Ups', value: data.leads.followUp.toLocaleString(), colorClass: 'text-emerald-600', subLabel: 'Scheduled' },
    { icon: Activity, label: 'Avg Call Duration', value: data.summary.avgCallDuration + 's', colorClass: 'text-teal-600', subLabel: 'Incl. ringing' },
    { icon: Timer, label: 'Total Talk', value: data.summary.totalTalkTimeFmt, colorClass: 'text-slate-600', subLabel: 'Cumulative' },
    { icon: Repeat, label: 'Calls / Number', value: data.leads.callsPerUniqueNumber, colorClass: 'text-amber-600', subLabel: `${data.leads.uniqueNumbers.toLocaleString()} Leads` },
    { icon: BarChart2, label: 'Efficiency', value: data.leads.leadQualPct > 5 ? 'High' : 'Normal', colorClass: 'text-slate-500', subLabel: 'Status check' },
  ] : []

  return (
    <div>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar
          dateRange={dateRange}
          selectedAgent={selectedAgent}
          onRangeChange={setDateRange}
          onAgentChange={setSelectedAgent}
          onRefresh={refetch}
          loading={loading || refreshing}
          lastUpdated={lastUpdated}
        />

        <div className="max-w-[1600px] mx-auto px-4 py-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
              <span>{error === 'INVALID_API_KEY' ? 'Invalid API Key — check VITE_BRIGHTCALL_API_KEY in .env' : 'Failed to fetch data. Check your connection.'}</span>
              <button onClick={refetch} className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition text-xs font-semibold">Retry</button>
            </div>
          )}

          {/* Progress bar — only shown on first load (no cache) */}
          {loading && progress.total > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Fetching call data...</span>
                <span className="font-mono text-slate-700">{progress.done} / {progress.total} pages</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.round(progress.done / progress.total * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Alerts */}
          {data && <AlertBanner data={data} />}

          {/* KPI Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {loading ? Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>) :
              kpi1.map((k, i) => <KPICard key={k.label} {...k} delay={i * 50} />)}
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {loading ? Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>) :
              kpi2.map((k, i) => <KPICard key={k.label} {...k} delay={300 + i * 50} />)}
          </div>

          {/* Funnel */}
          {loading ? <SkeletonCard className="h-40" /> : data && <FunnelChart data={data} />}

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {loading ? <><SkeletonCard className="lg:col-span-2 h-64" /><SkeletonCard className="h-64" /></> : data && <>
              <div className="lg:col-span-2"><DailyBarChart data={data.callsByDay} /></div>
              <QualityDonut quality={data.quality} total={data.summary.totalCalls} />
            </>}
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <><SkeletonCard className="h-64" /><SkeletonCard className="h-64" /></> : data && <>
              <OutcomeChart data={data.outcomeDist} />
              <HourlyAreaChart data={data.callsByHour} />
            </>}
          </div>

          {/* Gauge + Agent table */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {loading ? <><SkeletonCard className="h-64" /><SkeletonCard className="lg:col-span-3 h-64" /></> : data && <>
              <EfficiencyGauge data={data} />
              <div className="lg:col-span-3"><AgentTable agents={data.agentPerformance} /></div>
            </>}
          </div>

          {/* Heatmap */}
          {loading ? <SkeletonCard className="h-48" /> : data && <HeatmapGrid heatmap={data.heatmap} />}

        </div>
      </div>
    </div>
  )
}
