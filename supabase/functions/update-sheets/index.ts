import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SA_EMAIL             = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
const PRIVATE_KEY_RAW      = Deno.env.get('GOOGLE_PRIVATE_KEY')!
const SHEET_ID             = Deno.env.get('GOOGLE_SHEET_ID')!

const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`

const AGENT_MAP: Record<string, { name: string; slug: string }> = {
  '827909': { name: 'Sana',     slug: 'telesales1' },
  '827910': { name: 'Huzaifa', slug: 'telesales2' },
  '827911': { name: 'Mohamed', slug: 'telesales3' },
  '827912': { name: 'Mehak',   slug: 'telesales4' },
}
const VALID_AGENTS = new Set(Object.keys(AGENT_MAP))

// ── Google JWT auth ────────────────────────────────────────────────────────────

function b64url(input: Uint8Array | string): string {
  const str = typeof input === 'string' ? input : String.fromCharCode(...input)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getGoogleToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const hdr = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const pay = b64url(JSON.stringify({
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))
  const signing = `${hdr}.${pay}`

  const pemBody = PRIVATE_KEY_RAW
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN[^-]*-----\n?/g, '')
    .replace(/-----END[^-]*-----\n?/g, '')
    .replace(/\s/g, '')

  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signing))
  const jwt = `${signing}.${b64url(new Uint8Array(sig))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error(`Google auth failed: ${JSON.stringify(json)}`)
  return json.access_token
}

// ── Sheets API helpers ─────────────────────────────────────────────────────────

type Row = (string | number)[]

async function sheetRead(token: string, range: string, unformatted = false): Promise<Row[]> {
  const qs  = unformatted ? '?valueRenderOption=UNFORMATTED_VALUE' : ''
  const res = await fetch(`${SHEETS_BASE}/values/${encodeURIComponent(range)}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`sheetRead "${range}" failed ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`)
  return (json.values ?? []) as Row[]
}

async function sheetAppend(token: string, range: string, values: Row[]): Promise<void> {
  const res = await fetch(
    `${SHEETS_BASE}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`sheetAppend "${range}" failed ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`)
}

async function sheetBatchWrite(token: string, updates: { range: string; values: Row[] }[]): Promise<void> {
  if (updates.length === 0) { console.warn('[sheetBatchWrite] called with 0 updates — skipping'); return }
  const CHUNK = 500
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK)
    const res = await fetch(`${SHEETS_BASE}/values:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: slice.map(u => ({ range: u.range, majorDimension: 'ROWS', values: u.values })),
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(`sheetBatchWrite failed ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`)
  }
}

// ── Metric computation ─────────────────────────────────────────────────────────

interface Call {
  timestamp: string
  state: number
  talkTime: number
  totalTime: number
  outcomeTag: string
  involvedAgent1Id: string
  clientNumber: string
  tags: string[]
}

const is = (c: Call, tag: string) =>
  (c.outcomeTag ?? '').trim().toLowerCase() === tag.toLowerCase()

const secStr = (n: number) => `${Math.round(n)} sec`

function computeMetrics(raw: Call[]) {
  const calls    = raw.filter(c => VALID_AGENTS.has(String(c.involvedAgent1Id)))
  const total    = calls.length
  const ans      = calls.filter(c => c.state === 1)
  const ansCount = ans.length
  const totalTalk = ans.reduce((s, c) => s + (c.talkTime ?? 0), 0)
  const totalDur  = calls.reduce((s, c) => s + (c.totalTime ?? 0), 0)
  const noAnswer  = calls.filter(c => is(c, 'No Answer')).length
  const busy      = calls.filter(c => (c.tags ?? []).includes('Busy')).length
  const followUp  = calls.filter(c => is(c, 'Follow Up')).length
  const appt      = calls.filter(c => is(c, 'Appointment Scheduled')).length
  const qualified = calls.filter(c => is(c, 'Qualified')).length
  const short      = ans.filter(c => (c.talkTime ?? 0) > 0 && (c.talkTime ?? 0) < 10).length
  const medium     = ans.filter(c => (c.talkTime ?? 0) >= 10 && (c.talkTime ?? 0) < 30).length
  const meaningful = ans.filter(c => (c.talkTime ?? 0) >= 30).length

  return {
    total, ansCount, noAnswer, busy, followUp, appt, qualified, short, medium, meaningful,
    connRate:     total    > 0 ? Math.round(ansCount / total * 1000) / 1000 : 0,
    avgDur:       total    > 0 ? secStr(totalDur / total)             : '0 sec',
    avgTalk:      ansCount > 0 ? secStr(totalTalk / ansCount)         : '0 sec',
    totalTalkStr: secStr(totalTalk),
    leadPct:      total    > 0 ? appt / total                         : 0,
    callsPerLead: appt     > 0 ? Math.round(total / appt * 100) / 100 : 0,
    noAnswerPct:  total    > 0 ? noAnswer / total                     : 0,
    busyPct:      total    > 0 ? busy / total                         : 0,
  }
}

// Maps sheet row label → metric value
function metricValues(mm: ReturnType<typeof computeMetrics>): Record<string, string | number> {
  return {
    'Total Calls Attempted':       mm.total,
    'Answered Calls':              mm.ansCount,
    'Connection Rate':             mm.connRate,
    'Avg Call Duration':           mm.avgDur,
    'Avg Talk Time':               mm.avgTalk,
    'Total Talk Time':             mm.totalTalkStr,
    'Follow Up':                   mm.followUp,
    'Appointment Scheduled':       mm.appt,
    'Short Calls (<10s talk)':     mm.short,
    'Calls (>10 <30 Talks)':       mm.medium,
    'Meaningful Calls (>30s talk)': mm.meaningful,
    'Lead Qualification %':        mm.leadPct,
    'Calls per Lead':              mm.callsPerLead,
    'No Answer':                   mm.noAnswer,
    'Busy':                        mm.busy,
    'No Answer %':                 mm.noAnswerPct,
    'Busy %':                      mm.busyPct,
  }
}

function computeAgentMetrics(raw: Call[]) {
  const map: Record<string, {
    name: string; slug: string; calls: number; answered: number
    talkTime: number; followUp: number; appt: number; qualified: number
  }> = {}
  for (const c of raw) {
    const aid = String(c.involvedAgent1Id)
    if (!AGENT_MAP[aid]) continue
    if (!map[aid]) map[aid] = { ...AGENT_MAP[aid], calls: 0, answered: 0, talkTime: 0, followUp: 0, appt: 0, qualified: 0 }
    const s = map[aid]
    s.calls++
    if (c.state === 1) { s.answered++; s.talkTime += c.talkTime ?? 0 }
    if (is(c, 'Follow Up'))             s.followUp++
    if (is(c, 'Appointment Scheduled')) s.appt++
    if (is(c, 'Qualified'))             s.qualified++
  }
  return Object.values(map)
}

// ── Date helpers ───────────────────────────────────────────────────────────────

const EXCEL_EPOCH = new Date(1899, 11, 30).getTime()
const toExcelSerial = (d: Date) => Math.floor((d.getTime() - EXCEL_EPOCH) / 86400000)
const monthLabel    = (d: Date) => d.toLocaleString('en-US', { month: 'long' })
const fmtDate       = (d: Date) => d.toISOString().split('T')[0]

// ── Supabase: fetch all calls with pagination ─────────────────────────────────

async function fetchAllCalls(supabase: ReturnType<typeof createClient>, from: string, to: string): Promise<Call[]> {
  const PAGE = 1000
  const all: Call[] = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .gte('timestamp', `${from}T00:00:00Z`)
      .lte('timestamp', `${to}T23:59:59Z`)
      .order('timestamp', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1)
    if (error) throw new Error(`Supabase fetch failed: ${error.message}`)
    if (data) all.push(...data)
    if (!data || data.length < PAGE) break
    page++
  }
  return all
}

// ── Sheet updaters ─────────────────────────────────────────────────────────────

async function updateDaily(token: string, callsByDate: Record<string, Call[]>): Promise<void> {
  // Use UNFORMATTED_VALUE so date cells return raw serial numbers (e.g. 46119)
  // instead of the formatted display string (e.g. "April 8")
  const existingRows = await sheetRead(token, 'Daily!A:M', true)

  // Build a map: excelSerial → row index (1-indexed)
  const serialToRowNum: Record<number, number> = {}
  for (let i = 0; i < existingRows.length; i++) {
    const s = Number(existingRows[i][1])
    if (!isNaN(s) && s > 40000) serialToRowNum[s] = i + 1
  }

  const updates: { range: string; values: Row[] }[] = []
  const newRows: Row[] = []

  const sortedDates = Object.keys(callsByDate).sort()
  for (const dateStr of sortedDates) {
    const d   = new Date(dateStr)
    const dm  = computeMetrics(callsByDate[dateStr])
    const ser = toExcelSerial(d)
    const row: Row = [
      '', ser, dm.total, dm.ansCount, dm.noAnswer, dm.busy,
      dm.appt, dm.connRate, dm.avgDur, dm.avgTalk, dm.totalTalkStr,
      dm.followUp, dm.appt,
    ]
    const rowNum = serialToRowNum[ser]
    if (rowNum) {
      updates.push({ range: `Daily!A${rowNum}:M${rowNum}`, values: [row] })
    } else {
      newRows.push(row)
    }
  }

  await sheetBatchWrite(token, updates)
  if (newRows.length > 0) await sheetAppend(token, 'Daily!A:M', newRows)

  console.log(`[update-sheets] Daily: ${updates.length} updated, ${newRows.length} appended`)
}

async function updateMonthly(token: string, callsByMonth: Record<string, Call[]>): Promise<void> {
  const existingRows = await sheetRead(token, 'Monthly!A:K')
  const monthToRowNum: Record<string, number> = {}
  for (let i = 0; i < existingRows.length; i++) {
    const m = String(existingRows[i][1] ?? '').trim()
    if (m) monthToRowNum[m] = i + 1
  }

  const updates: { range: string; values: Row[] }[] = []
  const newRows: Row[] = []

  for (const [month, calls] of Object.entries(callsByMonth)) {
    const mm = computeMetrics(calls)
    const row: Row = ['', month, mm.total, mm.ansCount, mm.noAnswer, mm.busy, mm.appt, mm.connRate, mm.avgDur, mm.avgTalk, mm.totalTalkStr]
    const rowNum = monthToRowNum[month]
    if (rowNum) {
      updates.push({ range: `Monthly!A${rowNum}:K${rowNum}`, values: [row] })
    } else {
      newRows.push(row)
    }
  }

  await sheetBatchWrite(token, updates)
  if (newRows.length > 0) await sheetAppend(token, 'Monthly!A:K', newRows)

  console.log(`[update-sheets] Monthly: ${updates.length} updated, ${newRows.length} appended`)
}

async function updateAgent(token: string, callsByMonth: Record<string, Call[]>): Promise<void> {
  const existingRows = await sheetRead(token, 'Agent!A:K')

  // Find month block starts (column A has the month name for the first agent in the block)
  const monthBlockStart: Record<string, number> = {}
  for (let i = 0; i < existingRows.length; i++) {
    const m = String(existingRows[i][0] ?? '').trim()
    if (m && !monthBlockStart[m]) monthBlockStart[m] = i
  }

  const updates: { range: string; values: Row[] }[] = []
  const monthsToAppend: { month: string; rows: Row[] }[] = []

  for (const [month, calls] of Object.entries(callsByMonth)) {
    const agents = computeAgentMetrics(calls)
    const blockStart = monthBlockStart[month]

    if (blockStart !== undefined) {
      // Update existing rows within this month's block
      for (const a of agents) {
        const connPct = a.calls > 0 ? Math.round(a.answered / a.calls * 1000) / 1000 : 0
        const avgTalk = a.answered > 0 ? Math.round(a.talkTime / a.answered) : 0
        const qualPct = a.calls > 0 ? a.qualified / a.calls : 0

        let agentRowIdx = -1
        for (let i = blockStart; i < existingRows.length; i++) {
          const rowA = String(existingRows[i][0] ?? '').trim()
          if (i > blockStart && rowA !== '' && rowA !== month) break
          if (String(existingRows[i][2] ?? '').trim() === a.slug) { agentRowIdx = i; break }
        }

        const isFirst = agentRowIdx === blockStart
        const row: Row = [
          isFirst ? month : '', a.name, a.slug,
          a.calls, a.answered, connPct,
          `${a.talkTime} sec`, `${avgTalk} sec`,
          a.followUp, a.qualified, qualPct,
        ]

        if (agentRowIdx >= 0) {
          updates.push({ range: `Agent!A${agentRowIdx + 1}:K${agentRowIdx + 1}`, values: [row] })
        }
      }
    } else {
      // New month block — collect all 4 agent rows together
      const newRows: Row[] = agents.map((a, i) => {
        const connPct = a.calls > 0 ? Math.round(a.answered / a.calls * 1000) / 1000 : 0
        const avgTalk = a.answered > 0 ? Math.round(a.talkTime / a.answered) : 0
        const qualPct = a.calls > 0 ? a.qualified / a.calls : 0
        return [
          i === 0 ? month : '', a.name, a.slug,
          a.calls, a.answered, connPct,
          `${a.talkTime} sec`, `${avgTalk} sec`,
          a.followUp, a.qualified, qualPct,
        ]
      })
      monthsToAppend.push({ month, rows: newRows })
    }
  }

  await sheetBatchWrite(token, updates)

  // Append new month blocks in chronological order
  const MONTH_ORDER = ['January','February','March','April','May','June','July','August','September','October','November','December']
  monthsToAppend.sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
  for (const { rows } of monthsToAppend) {
    await sheetAppend(token, 'Agent!A:K', rows)
  }

  console.log(`[update-sheets] Agent: ${updates.length} rows updated, ${monthsToAppend.length} new month blocks appended`)
}

async function updateTopline(token: string, callsByMonth: Record<string, Call[]>): Promise<void> {
  const toplineRows = await sheetRead(token, 'Topline!A:Z')

  // Find header row dynamically — the row where col A = "Metrics"
  const headerRow = (toplineRows.find(r => String(r[0] ?? '').trim() === 'Metrics') ?? []) as string[]

  // Build label → sheet row number map from column A (skipping the header row itself)
  const labelToRow: Record<string, number> = {}
  for (let r = 0; r < toplineRows.length; r++) {
    const label = String(toplineRows[r][0] ?? '').trim()
    if (label && label !== 'Metrics') labelToRow[label] = r + 1
  }

  const updates: { range: string; values: Row[] }[] = []

  console.log(`[Topline] headerRow sample: ${JSON.stringify(headerRow.slice(0, 6))}`)
  console.log(`[Topline] labelToRow keys: ${Object.keys(labelToRow).join(', ')}`)

  for (const [month, calls] of Object.entries(callsByMonth)) {
    const colIdx = headerRow.findIndex(c => String(c ?? '').trim() === month)
    if (colIdx < 0) {
      console.warn(`[Topline] no column found for "${month}" in headerRow — check tab name and header row content`)
      continue
    }
    const col    = String.fromCharCode(65 + colIdx)
    console.log(`[Topline] writing month "${month}" → column ${col}, building updates from ${Object.keys(labelToRow).length} labels`)
    const values = metricValues(computeMetrics(calls))

    for (const [label, value] of Object.entries(values)) {
      const rowNum = labelToRow[label]
      if (rowNum) updates.push({ range: `Topline!${col}${rowNum}`, values: [[value]] })
      else console.warn(`[Topline] label not found in sheet: "${label}"`)
    }
  }

  console.log(`[Topline] total updates to write: ${updates.length}`)
  await sheetBatchWrite(token, updates)
  console.log(`[Topline] done`)
}

// Week of month: W1=1-7, W2=8-14, W3=15-21, W4=22-31
function weekLabel(d: Date): string {
  const day = d.getDate()
  if (day <= 7)  return 'W1'
  if (day <= 14) return 'W2'
  if (day <= 21) return 'W3'
  return 'W4'
}

async function updateSummary(token: string, callsByDate: Record<string, Call[]>): Promise<void> {
  const summaryRows = await sheetRead(token, 'Summary!A:Z')

  const MONTH_NAMES = new Set(['January','February','March','April','May','June','July','August','September','October','November','December'])

  // Find header rows dynamically regardless of blank rows above
  const monthHeaderRow = (summaryRows.find(r => r.some(c => MONTH_NAMES.has(String(c ?? '').trim()))) ?? []) as string[]
  const weekHeaderRow  = (summaryRows.find(r => r.some(c => /^W[1-4]$/.test(String(c ?? '').trim()))) ?? []) as string[]

  // Build column map: "April_W2" → column letter
  // Blank separator columns (empty month AND empty week) reset the current month
  // so that orphaned W1/W2 columns at the end don't map to the previous month.
  const colMap: Record<string, string> = {}
  let currentMonth = ''
  for (let c = 1; c < monthHeaderRow.length; c++) {
    const m = String(monthHeaderRow[c] ?? '').trim()
    const w = String(weekHeaderRow[c] ?? '').trim()
    if (m) {
      currentMonth = m
    } else if (!w) {
      currentMonth = '' // separator column — break month group
      continue
    }
    if (currentMonth && w) {
      colMap[`${currentMonth}_${w}`] = String.fromCharCode(65 + c)
    }
  }

  // Build label → row number map from column A (same as Topline)
  const labelToRow: Record<string, number> = {}
  for (let r = 0; r < summaryRows.length; r++) {
    const label = String(summaryRows[r][0] ?? '').trim()
    if (label && label !== 'Metrics') labelToRow[label] = r + 1
  }

  // Group calls by month_week
  const byWeek: Record<string, Call[]> = {}
  for (const [dateStr, calls] of Object.entries(callsByDate)) {
    const d   = new Date(dateStr)
    const key = `${monthLabel(d)}_${weekLabel(d)}`
    if (!byWeek[key]) byWeek[key] = []
    byWeek[key].push(...calls)
  }

  const updates: { range: string; values: Row[] }[] = []

  for (const [key, calls] of Object.entries(byWeek)) {
    const col = colMap[key]
    if (!col) {
      console.warn(`[update-sheets] Summary: no column for "${key}"`)
      continue
    }
    const values = metricValues(computeMetrics(calls))
    for (const [label, value] of Object.entries(values)) {
      const rowNum = labelToRow[label]
      if (rowNum) updates.push({ range: `Summary!${col}${rowNum}`, values: [[value]] })
    }
  }

  console.log(`[Summary] colMap: ${JSON.stringify(colMap)}`)
  console.log(`[Summary] byWeek keys: ${Object.keys(byWeek).join(', ')}`)
  console.log(`[Summary] total updates to write: ${updates.length}`)
  await sheetBatchWrite(token, updates)
  console.log(`[Summary] done`)
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const url      = new URL(req.url)
  const mode     = url.searchParams.get('mode') ?? 'daily'        // 'daily' | 'backfill'
  const fromParam = url.searchParams.get('from') ?? '2026-03-01'  // backfill start date

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token    = await getGoogleToken()
    const now      = new Date()

    if (mode === 'backfill') {
      // ── Backfill mode: fetch all historical data at once ────────────────────
      console.log(`[update-sheets] Backfill from ${fromParam} to ${fmtDate(now)}`)

      const allCalls = await fetchAllCalls(supabase, fromParam, fmtDate(now))
      console.log(`[update-sheets] Fetched ${allCalls.length} total calls`)

      // Group by date string and by month name
      const byDate:  Record<string, Call[]> = {}
      const byMonth: Record<string, Call[]> = {}

      for (const c of allCalls) {
        if (!c.timestamp) continue
        const d        = new Date(c.timestamp)
        const dateStr  = fmtDate(d)
        const month    = monthLabel(d)
        if (!byDate[dateStr])  byDate[dateStr]  = []
        if (!byMonth[month])   byMonth[month]   = []
        byDate[dateStr].push(c as unknown as Call)
        byMonth[month].push(c as unknown as Call)
      }

      // Update all five sheets
      await updateDaily(token, byDate)
      await updateMonthly(token, byMonth)
      await updateAgent(token, byMonth)
      await updateTopline(token, byMonth)
      await updateSummary(token, byDate)

      return new Response(
        JSON.stringify({ success: true, mode: 'backfill', from: fromParam, to: fmtDate(now), totalCalls: allCalls.length, days: Object.keys(byDate).length, months: Object.keys(byMonth) }),
        { headers: { 'Content-Type': 'application/json' } }
      )

    } else {
      // ── Daily mode: yesterday + current month ───────────────────────────────
      const yesterday  = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr       = fmtDate(yesterday)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthStr   = monthLabel(now)

      console.log(`[update-sheets] Daily update for ${yStr}, month: ${monthStr}`)

      const [{ data: dayCalls }, { data: monthCalls }] = await Promise.all([
        supabase.from('calls').select('*').gte('timestamp', `${yStr}T00:00:00Z`).lte('timestamp', `${yStr}T23:59:59Z`),
        supabase.from('calls').select('*').gte('timestamp', `${fmtDate(monthStart)}T00:00:00Z`).lte('timestamp', `${fmtDate(now)}T23:59:59Z`),
      ])

      await updateDaily(token, { [yStr]: (dayCalls ?? []) as unknown as Call[] })
      await updateMonthly(token, { [monthStr]: (monthCalls ?? []) as unknown as Call[] })
      await updateAgent(token, { [monthStr]: (monthCalls ?? []) as unknown as Call[] })
      await updateTopline(token, { [monthStr]: (monthCalls ?? []) as unknown as Call[] })
      await updateSummary(token, { [yStr]: (dayCalls ?? []) as unknown as Call[] })

      return new Response(
        JSON.stringify({ success: true, mode: 'daily', date: yStr, month: monthStr }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error('[update-sheets] Fatal:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
