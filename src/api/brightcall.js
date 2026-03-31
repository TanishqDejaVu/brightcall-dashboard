import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const API_KEY = import.meta.env.VITE_BRIGHTCALL_API_KEY
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY) : null

const AGENT_NAMES = {
  '827909': 'Telesales 1',
  '827910': 'Telesales 2',
  '827911': 'Telesales 3',
  '827912': 'Telesales 4',
  '827915': 'Telesales 5',
  '173827': 'Admin',
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

export function computeMetrics(calls) {
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

  const short      = calls.filter(c => (c.talkTime || 0) < 10).length
  const medium     = calls.filter(c => (c.talkTime || 0) >= 10 && (c.talkTime || 0) < 30).length
  const meaningful = calls.filter(c => (c.talkTime || 0) >= 30).length

  // Leads = Appointment Scheduled + Qualified
  const leads = appt + qualified

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
    const day = (c.timestamp || '').slice(0, 10)
    if (!day) continue
    if (!byDayMap[day]) byDayMap[day] = { date: day, totalCalls: 0, answeredCalls: 0 }
    byDayMap[day].totalCalls++
    if (c.state === 1) byDayMap[day].answeredCalls++
  }
  const callsByDay = Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date))

  // Calls by hour
  const byHourMap = {}
  for (const c of calls) {
    const ts = c.timestamp || ''
    if (ts.length < 13) continue
    const hour = parseInt(ts.slice(11, 13), 10)
    byHourMap[hour] = (byHourMap[hour] || 0) + 1
  }
  const callsByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    callCount: byHourMap[h] || 0,
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
    quality: { short, medium, meaningful, shortPct: total>0?Math.round(short/total*100):0, mediumPct: total>0?Math.round(medium/total*100):0, meaningfulPct: total>0?Math.round(meaningful/total*100):0 },
    outcomeDist: outcomeDistArr,
    callsByDay,
    callsByHour,
    agentPerformance,
    heatmap,
    heatmapDayNames: DAY_NAMES,
  }
}
