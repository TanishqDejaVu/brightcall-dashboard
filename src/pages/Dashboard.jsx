import { useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useTheme } from '../hooks/useTheme'
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

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-0.5 h-3.5 bg-blue-500 rounded-full opacity-60" />
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{children}</span>
    </div>
  )
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('1w')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const { data, loading, refreshing, progress, error, lastUpdated, refetch } = useDashboard(dateRange, selectedAgent)
  const { isDark, toggleTheme } = useTheme()

  const kpi1 = data ? [
    { icon: PhoneCall, label: 'Answered', value: data.summary.answeredCalls.toLocaleString(), colorClass: 'text-emerald-400', subLabel: 'Connected calls', breakdown: data.breakdowns.answered },
    { icon: PhoneOff, label: 'Unanswered', value: (data.summary.totalCalls - data.summary.answeredCalls).toLocaleString(), colorClass: 'text-red-400', subLabel: 'Missed / lost', breakdown: data.breakdowns.unanswered },
    { icon: Phone, label: 'Total Calls', value: data.summary.totalCalls.toLocaleString(), colorClass: 'text-blue-400', subLabel: 'Total attempts' },
    { icon: TrendingUp, label: 'Conn. Rate', value: data.summary.connectionRate + '%', colorClass: data.summary.connectionRate >= 25 ? 'text-emerald-400' : 'text-amber-400', healthType: 'connection_rate', subLabel: 'Answer rate' },
    { icon: Target, label: 'Lead Qual %', value: data.leads.leadQualPct + '%', colorClass: 'text-purple-400', subLabel: 'Of total calls' },
    { icon: Clock, label: 'Avg Talk Time', value: data.summary.avgTalkTimeFmt, colorClass: 'text-indigo-400', subLabel: 'Per call' },
  ] : []

  const kpi2 = data ? [
    { icon: CalendarCheck, label: 'Appointments', value: data.leads.appt.toLocaleString(), colorClass: 'text-blue-400', subLabel: data.leads.leads + ' total qualified' },
    { icon: UserCheck, label: 'Follow Ups', value: data.leads.followUp.toLocaleString(), colorClass: 'text-emerald-400', subLabel: 'Scheduled' },
    { icon: Activity, label: 'Avg Duration', value: data.summary.avgCallDuration + 's', colorClass: 'text-teal-400', subLabel: 'Incl. ringing' },
    { icon: Timer, label: 'Total Talk', value: data.summary.totalTalkTimeFmt, colorClass: 'text-slate-400', subLabel: 'Cumulative' },
    { icon: Repeat, label: 'Calls / Number', value: data.leads.callsPerUniqueNumber, colorClass: 'text-amber-400', subLabel: `${data.leads.uniqueNumbers.toLocaleString()} leads` },
    { icon: BarChart2, label: 'Efficiency', value: data.leads.leadQualPct > 5 ? 'High' : 'Normal', colorClass: 'text-slate-400', subLabel: 'Status check' },
  ] : []

  return (
    <div className="min-h-screen bg-[var(--bg-page)] bg-grid text-slate-900 dark:text-slate-100">
      <Navbar
        dateRange={dateRange}
        selectedAgent={selectedAgent}
        onRangeChange={setDateRange}
        onAgentChange={setSelectedAgent}
        onRefresh={refetch}
        loading={loading || refreshing}
        lastUpdated={lastUpdated}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <div className="max-w-[1600px] mx-auto px-5 py-7 space-y-7">

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <span>{error === 'INVALID_API_KEY' ? 'Invalid API Key — check VITE_BRIGHTCALL_API_KEY in .env' : 'Failed to fetch data. Check your connection.'}</span>
            <button onClick={refetch} className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 transition text-xs font-semibold">Retry</button>
          </div>
        )}

        {/* Progress bar */}
        {loading && progress.total > 0 && (
          <div className="rounded-2xl border border-[var(--bd-card)] bg-[var(--bg-card)] px-5 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>Fetching call data...</span>
              <span className="font-mono text-slate-500">{progress.done} / {progress.total} pages</span>
            </div>
            <div className="h-[3px] rounded-full bg-slate-200 dark:bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.round(progress.done / progress.total * 100)}%`, boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
              />
            </div>
          </div>
        )}

        {/* Alerts */}
        {data && <AlertBanner data={data} />}

        {/* KPI rows */}
        <div>
          <SectionLabel>Key Metrics</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            {loading ? Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>) :
              kpi1.map((k, i) => <KPICard key={k.label} {...k} delay={i * 60} />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {loading ? Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>) :
              kpi2.map((k, i) => <KPICard key={k.label} {...k} delay={360 + i * 60} />)}
          </div>
        </div>

        {/* Funnel */}
        <div>
          <SectionLabel>Conversion Funnel</SectionLabel>
          {loading ? <SkeletonCard className="h-36" /> : data && <FunnelChart data={data} />}
        </div>

        {/* Charts row 1 */}
        <div>
          <SectionLabel>Call Activity</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {loading ? <><SkeletonCard className="lg:col-span-2 h-64" /><SkeletonCard className="h-64" /></> : data && <>
              <div className="lg:col-span-2"><DailyBarChart data={data.callsByDay} isDark={isDark} /></div>
              <QualityDonut quality={data.quality} total={data.summary.totalCalls} isDark={isDark} />
            </>}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? <><SkeletonCard className="h-64" /><SkeletonCard className="h-64" /></> : data && <>
            <OutcomeChart data={data.outcomeDist} isDark={isDark} />
            <HourlyAreaChart data={data.callsByHour} isDark={isDark} />
          </>}
        </div>

        {/* Gauge + Agent table */}
        <div>
          <SectionLabel>Agent Performance</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {loading ? <><SkeletonCard className="h-64" /><SkeletonCard className="lg:col-span-3 h-64" /></> : data && <>
              <EfficiencyGauge data={data} isDark={isDark} />
              <div className="lg:col-span-3"><AgentTable agents={data.agentPerformance} /></div>
            </>}
          </div>
        </div>

        {/* Heatmap */}
        <div>
          <SectionLabel>Activity Heatmap</SectionLabel>
          {loading ? <SkeletonCard className="h-48" /> : data && <HeatmapGrid heatmap={data.heatmap} isDark={isDark} />}
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-slate-200 dark:border-white/[0.04]">
          <span className="text-[11px] text-slate-400">Brightcall Analytics · Auto-refreshes every 5 min</span>
        </div>

      </div>
    </div>
  )
}
