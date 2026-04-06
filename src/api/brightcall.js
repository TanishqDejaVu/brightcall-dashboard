import axios from 'axios'
import { supabase } from '../lib/supabase'

const API_KEY = import.meta.env.VITE_BRIGHTCALL_API_KEY

const AGENT_NAMES = {
  '827909': 'Telesales 1',
  '827910': 'Telesales 2',
  '827911': 'Telesales 3',
  '827912': 'Telesales 4',
}

function buildPayload(dayFrom, dayTo, page = 1) {
  return {
    dayFrom, dayTo,
    dateInterval: 'day',
    allUsers: true,
    page,
    itemsPerPage: 100,
    sortBy: 'timestamp',
    sortDirection: 'DESC',
  }
}

// Fetch pages in batches to avoid overwhelming the proxy / API
async function fetchBatched(pages, startDate, endDate, params, onProgress) {
  const BATCH = 5
  const allCalls = []
  let done = 0
  for (let i = 0; i < pages; i += BATCH) {
    const batch = Array.from(
      { length: Math.min(BATCH, pages - i) },
      (_, j) => axios.post('/api/v3/stat/calls/list', buildPayload(startDate, endDate, i + j + 1), { params })
    )
    const results = await Promise.all(batch)
    for (const r of results) {
      if (r.data?.calls) allCalls.push(...r.data.calls)
    }
    done += batch.length
    onProgress?.(done, pages)
  }
  return allCalls
}

export async function fetchAllCalls(startDate, endDate, onProgress) {
  // ⚡ Hyperspeed Datastore Query Logic
  if (supabase) {
    let allData = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .gte('timestamp', `${startDate}T00:00:00Z`)
        .lte('timestamp', `${endDate}T23:59:59Z`)
        .order('timestamp', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
      if (error) {
        console.error("Supabase fetch failed", error);
        throw new Error('FETCH_ERROR');
      }
      
      if (data) allData.push(...data);
      
      // If we received fewer than 1000 rows, we have hit the end of the query
      if (!data || data.length < PAGE_SIZE) break;
      page++;
    }
    
    onProgress?.(1, 1);
    return allData;
  }

  // 🐢 Fallback Pagination Proxy Logic
  const params = { 'api-key': API_KEY }
  try {
    const countRes = await axios.post(
      '/api/v3/stat/calls/count',
      buildPayload(startDate, endDate),
      { params }
    )
    const pages = countRes.data?.pagesCount || 1
    onProgress?.(0, pages)
    return await fetchBatched(pages, startDate, endDate, params, onProgress)
  } catch (err) {
    if (err.response?.status === 401) throw new Error('INVALID_API_KEY')
    throw err
  }
}

export function computeMetrics(allCalls) {
  // 🚫 Filtering out Admin and Telesales 5 for a clean agent-only dashboard
  const calls = allCalls.filter(c => {
    const aid = String(c.involvedAgent1Id || c.userId || '')
    return (aid === '827909' || aid === '827910' || aid === '827911' || aid === '827912')
  })

  const total         = calls.length
  const answeredCalls = calls.filter(c => c.state === 1)
  const answered      = answeredCalls.length
  const talkTimes = answeredCalls.map(c => c.talkTime || 0)   // only answered calls have real talk time
  const callDurs  = calls.map(c => c.totalTime || 0)
  const totalTalk = talkTimes.reduce((a, b) => a + b, 0)

  const outcomeMatch = (c, val) => (c.outcomeTag || '').trim().toLowerCase() === val.toLowerCase()
  const followUp  = calls.filter(c => outcomeMatch(c, 'Follow Up')).length
  const appt      = calls.filter(c => outcomeMatch(c, 'Appointment Scheduled')).length
  const qualified = calls.filter(c => outcomeMatch(c, 'Qualified')).length
  // No Answer: case-insensitive — API has both 'No Answer' and 'No answer'
  const noAnswer  = calls.filter(c => outcomeMatch(c, 'No Answer')).length
  // Busy comes from tags array, not outcomeTag
  const busy      = calls.filter(c => (c.tags || []).includes('Busy')).length

  const short      = answeredCalls.filter(c => (c.talkTime || 0) > 0 && (c.talkTime || 0) < 10).length
  const medium     = answeredCalls.filter(c => (c.talkTime || 0) >= 10 && (c.talkTime || 0) < 30).length
  const meaningful = answeredCalls.filter(c => (c.talkTime || 0) >= 30).length

  // Leads = Appointment Scheduled + Qualified
  const leads = appt + qualified

  const unansweredTags = [
    'Not answered', 'Not eligible', 'not interested', 'number not in use', 
    'do not call', 'not requested', 'real estate agent', 'job seeker', 
    'no longer interested', 'wrong no', 'no does not exist', 'no answer', 
    'switch off', 'busy', 'not reachable', 'hung up', 'other reason'
  ]
  const unansweredBreakdown = unansweredTags.map(tag => ({
    label: tag,
    count: calls.filter(c => outcomeMatch(c, tag)).length
  })).filter(b => b.count > 0).sort((a,b) => b.count - a.count)

  const answeredBreakdown = [
    { label: 'Follow Up', count: followUp },
    { label: 'Qualified', count: leads } // Qualified + Appointment scheduled
  ].filter(b => b.count > 0)

  // Calls per Lead = Total Calls / Unique phone numbers dialled
  const uniqueNumbers = new Set(calls.map(c => c.clientNumber).filter(Boolean)).size
  const callsPerUniqueNumber = uniqueNumbers > 0 ? Math.round(total / uniqueNumbers * 100) / 100 : 0

  // Outcome distribution
  const outcomeDist = {}
  for (const c of calls) {
    const tag = (c.outcomeTag || 'No Tag').trim() || 'No Tag'
    outcomeDist[tag] = (outcomeDist[tag] || 0) + 1
  }
  const outcomeDistArr = Object.entries(outcomeDist)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Calls by day
  const byDayMap = {}
  for (const c of calls) {
    if (!c.timestamp) continue
    const d = new Date(c.timestamp)
    // using en-CA locale for a perfectly standard YYYY-MM-DD in browser local time
    const day = d.toLocaleDateString('en-CA') 
    
    if (!byDayMap[day]) byDayMap[day] = { date: day, totalCalls: 0, answeredCalls: 0 }
    byDayMap[day].totalCalls++
    if (c.state === 1) byDayMap[day].answeredCalls++
  }
  const callsByDay = Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date))

  // Calls by hour (Auto-converted to Local Time)
  const byHourMap = {}
  for (const c of calls) {
    if (!c.timestamp) continue
    const date = new Date(c.timestamp)
    const hour = date.getHours()
    if (!byHourMap[hour]) byHourMap[hour] = { total: 0, answered: 0 }
    byHourMap[hour].total += 1
    if (c.state === 1) byHourMap[hour].answered += 1
  }
  const callsByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    callCount: byHourMap[h]?.total || 0,
    answered: byHourMap[h]?.answered || 0,
    unanswered: (byHourMap[h]?.total || 0) - (byHourMap[h]?.answered || 0),
  }))

  // Agent stats
  const agentMap = {}
  for (const c of calls) {
    const uid = String(c.involvedAgent1Id || c.userId || '')
    const name = AGENT_NAMES[uid] || `Agent ${uid}`
    if (!agentMap[name]) agentMap[name] = { agentName: name, callsMade: 0, connected: 0, talkTime: 0, leads: 0 }
    const s = agentMap[name]
    s.callsMade++
    if (c.state === 1) { s.connected++; s.talkTime += c.talkTime || 0 }
    const out = (c.outcomeTag || '').trim().toLowerCase()
    if (out === 'appointment scheduled' || out === 'qualified') s.leads++
  }
  const agentPerformance = Object.values(agentMap).map(s => ({
    ...s,
    appointments: s.leads,
    avgTalkTime: s.connected > 0 ? Math.round(s.talkTime / s.connected) : 0,
    leadQualPct: s.callsMade > 0 ? Math.round(s.leads / s.callsMade * 100 * 10) / 10 : 0,
    connectionRate: s.callsMade > 0 ? Math.round(s.connected / s.callsMade * 100 * 10) / 10 : 0,
  })).sort((a, b) => b.callsMade - a.callsMade)

  // Heatmap: day-of-week x hour
  const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (const c of calls) {
    const ts = c.timestamp || ''
    if (ts.length < 13) continue
    const d = new Date(ts)
    heatmap[d.getDay()][d.getHours()]++
  }

  const fmt = s => { const sec = Math.round(s); const m = Math.floor(sec / 60); const ss = sec % 60; return `${m}:${String(ss).padStart(2,'0')}` }

  return {
    summary: {
      totalCalls: total,
      answeredCalls: answered,
      connectionRate: total > 0 ? Math.round(answered / total * 1000) / 10 : 0,
      avgTalkTime: answered > 0 ? Math.round(totalTalk / answered) : 0,
      avgTalkTimeFmt: answered > 0 ? fmt(totalTalk / answered) : '0:00',
      totalTalkTime: totalTalk,
      totalTalkTimeFmt: fmt(totalTalk),
      avgCallDuration: total > 0 ? Math.round(callDurs.reduce((a,b)=>a+b,0)/total) : 0,
    },
    leads: { followUp, appt, qualified, noAnswer, busy, leads,
      leadQualPct:           total > 0 ? Math.round(leads / total * 1000) / 10 : 0,
      callsPerUniqueNumber,
      uniqueNumbers,
    },
    quality: { short, medium, meaningful, shortPct: answered>0?Math.round(short/answered*100):0, mediumPct: answered>0?Math.round(medium/answered*100):0, meaningfulPct: answered>0?Math.round(meaningful/answered*100):0 },
    outcomeDist: outcomeDistArr,
    callsByDay,
    callsByHour,
    agentPerformance,
    heatmap,
    heatmapDayNames: DAY_NAMES,
    breakdowns: { unanswered: unansweredBreakdown, answered: answeredBreakdown }
  }
}
