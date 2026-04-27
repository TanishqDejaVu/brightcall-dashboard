import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SA_EMAIL            = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
const PRIVATE_KEY_RAW     = Deno.env.get('GOOGLE_PRIVATE_KEY')!
const SHEET_ID            = Deno.env.get('GOOGLE_SHEET_ID')!

const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`

// Agent ID → display info
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

async function sheetRead(token: string, range: string): Promise<Row[]> {
  const res = await fetch(`${SHEETS_BASE}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  return (json.values ?? []) as Row[]
}

async function sheetWrite(token: string, range: string, values: Row[]): Promise<void> {
  await fetch(`${SHEETS_BASE}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  })
}

async function sheetAppend(token: string, range: string, values: Row[]): Promise<void> {
  await fetch(
    `${SHEETS_BASE}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    }
  )
}

async function sheetBatchWrite(token: string, updates: { range: string; values: Row[] }[]): Promise<void> {
  await fetch(`${SHEETS_BASE}/values:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updates.map(u => ({ range: u.range, majorDimension: 'ROWS', values: u.values })),
    }),
  })
}

// ── Metric computation ─────────────────────────────────────────────────────────

interface Call {
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
  const calls   = raw.filter(c => VALID_AGENTS.has(String(c.involvedAgent1Id)))
  const total   = calls.length
  const ans     = calls.filter(c => c.state === 1)
  const ansCount = ans.length
  const totalTalk = ans.reduce((s, c) => s + (c.talkTime ?? 0), 0)
  const totalDur  = calls.reduce((s, c) => s + (c.totalTime ?? 0), 0)
  const noAnswer  = calls.filter(c => is(c, 'No Answer')).length
  const busy      = calls.filter(c => (c.tags ?? []).includes('Busy')).length
  const followUp  = calls.filter(c => is(c, 'Follow Up')).length
  const appt      = calls.filter(c => is(c, 'Appointment Scheduled')).length
  const qualified = calls.filter(c => is(c, 'Qualified')).length
  const short     = ans.filter(c => (c.talkTime ?? 0) > 0 && (c.talkTime ?? 0) < 10).length
  const meaningful = ans.filter(c => (c.talkTime ?? 0) >= 30).length

  return {
    total, ansCount, noAnswer, busy, followUp, appt, qualified, short, meaningful,
    connRate:    total   > 0 ? Math.round(ansCount / total * 1000) / 1000 : 0,
    avgDur:      total   > 0 ? secStr(totalDur / total) : '0 sec',
    avgTalk:     ansCount > 0 ? secStr(totalTalk / ansCount) : '0 sec',
    totalTalkStr: secStr(totalTalk),
    leadPct:     total > 0 ? appt / total : 0,
    callsPerLead: appt > 0 ? Math.round(total / appt * 100) / 100 : 0,
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
    if (is(c, 'Follow Up'))              s.followUp++
    if (is(c, 'Appointment Scheduled')) s.appt++
    if (is(c, 'Qualified'))             s.qualified++
  }

  return Object.values(map)
}

// ── Date helpers ───────────────────────────────────────────────────────────────

// Excel epoch is Dec 30 1899
const EXCEL_EPOCH = new Date(1899, 11, 30).getTime()

function toExcelSerial(d: Date): number {
  return Math.floor((d.getTime() - EXCEL_EPOCH) / 86400000)
}

function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'long' })
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token    = await getGoogleToken()

    const now       = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const yStr       = fmtDate(yesterday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStr   = monthLabel(now)

    console.log(`[update-sheets] Running for ${yStr}, month: ${monthStr}`)

    // ── Fetch calls from Supabase ────────────────────────────────────────────────

    const [{ data: dayCalls }, { data: monthCalls }] = await Promise.all([
      supabase.from('calls').select('*')
        .gte('timestamp', `${yStr}T00:00:00Z`)
        .lte('timestamp', `${yStr}T23:59:59Z`),
      supabase.from('calls').select('*')
        .gte('timestamp', `${fmtDate(monthStart)}T00:00:00Z`)
        .lte('timestamp', `${fmtDate(now)}T23:59:59Z`),
    ])

    const dm     = computeMetrics(dayCalls ?? [])
    const mm     = computeMetrics(monthCalls ?? [])
    const agents = computeAgentMetrics(monthCalls ?? [])

    // ── 1. Daily sheet ───────────────────────────────────────────────────────────
    // Columns: A(blank) B(Date) C(Total) D(Connected) E(No Answer) F(Busy)
    //          G(Qualified=Appt) H(Conn%) I(AvgDur) J(AvgTalk) K(TotalTalk)
    //          L(FollowUp) M(Appt Scheduled)

    const dailyRows  = await sheetRead(token, 'Daily!A:M')
    const ySerial    = toExcelSerial(yesterday)
    const dailyRowIdx = dailyRows.findIndex(r => Number(r[1]) === ySerial)

    const dailyRow: Row = [
      '', ySerial, dm.total, dm.ansCount, dm.noAnswer, dm.busy,
      dm.appt, dm.connRate, dm.avgDur, dm.avgTalk, dm.totalTalkStr,
      dm.followUp, dm.appt,
    ]

    if (dailyRowIdx >= 0) {
      await sheetWrite(token, `Daily!A${dailyRowIdx + 1}:M${dailyRowIdx + 1}`, [dailyRow])
      console.log(`[update-sheets] Daily: updated row ${dailyRowIdx + 1}`)
    } else {
      await sheetAppend(token, 'Daily!A:M', [dailyRow])
      console.log('[update-sheets] Daily: appended new row')
    }

    // ── 2. Monthly sheet ─────────────────────────────────────────────────────────
    // Columns: A(blank) B(Month) C(Total) D(Connected) E(No Answer) F(Busy)
    //          G(Qualified=Appt) H(Conn%) I(AvgDur) J(AvgTalk) K(TotalTalk)

    const monthlyRows = await sheetRead(token, 'Monthly!A:K')
    const monthlyIdx  = monthlyRows.findIndex(r => String(r[1] ?? '').trim() === monthStr)

    const monthlyRow: Row = [
      '', monthStr, mm.total, mm.ansCount, mm.noAnswer, mm.busy,
      mm.appt, mm.connRate, mm.avgDur, mm.avgTalk, mm.totalTalkStr,
    ]

    if (monthlyIdx >= 0) {
      await sheetWrite(token, `Monthly!A${monthlyIdx + 1}:K${monthlyIdx + 1}`, [monthlyRow])
      console.log(`[update-sheets] Monthly: updated row ${monthlyIdx + 1}`)
    } else {
      await sheetAppend(token, 'Monthly!A:K', [monthlyRow])
      console.log('[update-sheets] Monthly: appended new row')
    }

    // ── 3. Agent sheet ───────────────────────────────────────────────────────────
    // Columns: A(Month) B(Agent Name) C(Slug) D(Calls) E(Answered) F(Conn%)
    //          G(TalkTime) H(AvgTalk) I(FollowUp) J(Qualification) K(Qual%)
    // Note: column A only has month name for the FIRST agent row per month block

    const agentRows      = await sheetRead(token, 'Agent!A:K')
    const monthBlockStart = agentRows.findIndex(r => String(r[0] ?? '').trim() === monthStr)

    if (monthBlockStart >= 0) {
      // Month block exists — update individual agent rows
      for (const a of agents) {
        const connPct = a.calls > 0 ? Math.round(a.answered / a.calls * 1000) / 1000 : 0
        const avgTalk = a.answered > 0 ? Math.round(a.talkTime / a.answered) : 0
        const qualPct = a.calls > 0 ? a.qualified / a.calls : 0

        // Find this agent's row within the month block
        let agentRowIdx = -1
        for (let i = monthBlockStart; i < agentRows.length; i++) {
          const rowA = String(agentRows[i][0] ?? '').trim()
          if (i > monthBlockStart && rowA !== '' && rowA !== monthStr) break
          if (String(agentRows[i][2] ?? '').trim() === a.slug) { agentRowIdx = i; break }
        }

        const isFirst = agentRowIdx === monthBlockStart
        const row: Row = [
          isFirst ? monthStr : '', a.name, a.slug,
          a.calls, a.answered, connPct,
          `${a.talkTime} sec`, `${avgTalk} sec`,
          a.followUp, a.qualified, qualPct,
        ]

        if (agentRowIdx >= 0) {
          await sheetWrite(token, `Agent!A${agentRowIdx + 1}:K${agentRowIdx + 1}`, [row])
        } else {
          await sheetAppend(token, 'Agent!A:K', [['', a.name, a.slug, a.calls, a.answered, connPct, `${a.talkTime} sec`, `${avgTalk} sec`, a.followUp, a.qualified, qualPct]])
        }
      }
      console.log('[update-sheets] Agent: updated existing month block')
    } else {
      // New month — append all agent rows at once (first row has month name)
      const newRows: Row[] = agents.map((a, i) => {
        const connPct = a.calls > 0 ? Math.round(a.answered / a.calls * 1000) / 1000 : 0
        const avgTalk = a.answered > 0 ? Math.round(a.talkTime / a.answered) : 0
        const qualPct = a.calls > 0 ? a.qualified / a.calls : 0
        return [
          i === 0 ? monthStr : '', a.name, a.slug,
          a.calls, a.answered, connPct,
          `${a.talkTime} sec`, `${avgTalk} sec`,
          a.followUp, a.qualified, qualPct,
        ]
      })
      await sheetAppend(token, 'Agent!A:K', newRows)
      console.log('[update-sheets] Agent: appended new month block')
    }

    // ── 4. Topline sheet ─────────────────────────────────────────────────────────
    // Row 2 is the header: ["Metrics", 2026, "March", "April", ...]
    // Rows 3–15 are metrics, each month is a column

    const toplineRows = await sheetRead(token, 'Topline!A:Z')
    const headerRow   = (toplineRows[1] ?? []) as string[]
    const colIdx      = headerRow.findIndex(c => String(c ?? '').trim() === monthStr)

    if (colIdx >= 0) {
      const col = String.fromCharCode(65 + colIdx)

      // Metric rows 3–15 (1-indexed sheet rows), array index i → sheet row i+3
      const toplineValues = [
        mm.total,        // Row 3:  Total Calls Attempted
        mm.ansCount,     // Row 4:  Answered Calls
        mm.connRate,     // Row 5:  Connection Rate
        mm.avgDur,       // Row 6:  Avg Call Duration
        mm.avgTalk,      // Row 7:  Avg Talk Time
        mm.totalTalkStr, // Row 8:  Total Talk Time
        mm.followUp,     // Row 9:  Follow Up
        mm.appt,         // Row 10: Appointment Scheduled
        mm.short,        // Row 11: Short Calls (<10s)
        mm.meaningful,   // Row 12: Meaningful Calls (>30s)
        mm.leadPct,      // Row 13: Lead Qualification %
        mm.callsPerLead, // Row 14: Calls per Lead
        mm.noAnswer,     // Row 15: No Answer
      ]

      await sheetBatchWrite(
        token,
        toplineValues.map((v, i) => ({
          range: `Topline!${col}${i + 3}`,
          values: [[v]],
        }))
      )
      console.log(`[update-sheets] Topline: updated column ${col} (${monthStr})`)
    } else {
      console.warn(`[update-sheets] Topline: column for "${monthStr}" not found — add it to the header row`)
    }

    return new Response(
      JSON.stringify({ success: true, date: yStr, month: monthStr }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[update-sheets] Fatal:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
