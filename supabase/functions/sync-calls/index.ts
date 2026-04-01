import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BRIGHTCALL_KEY = Deno.env.get('BRIGHTCALL_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BRIGHTCALL_API = 'https://api.dialer.brightcall.ai'

function buildPayload(dayFrom: string, dayTo: string, page = 1) {
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

function getDateRange(backfill: boolean) {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - (backfill ? 180 : 2))
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { dayFrom: fmt(from), dayTo: fmt(today) }
}

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Optional: secure with a shared secret header
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_KEY}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(req.url)
  const backfill = url.searchParams.get('backfill') === 'true'
  const { dayFrom, dayTo } = getDateRange(backfill)

  console.log(`[sync-calls] Syncing ${dayFrom} → ${dayTo} (backfill: ${backfill})`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const params = new URLSearchParams({ 'api-key': BRIGHTCALL_KEY })

  try {
    // Get page count
    const countRes = await fetch(
      `${BRIGHTCALL_API}/api/v3/stat/calls/count?${params}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(dayFrom, dayTo)),
      }
    )
    const countData = await countRes.json()
    const pages: number = countData?.pagesCount || 1

    console.log(`[sync-calls] ${pages} pages to fetch`)

    let totalSynced = 0

    for (let i = 1; i <= pages; i++) {
      const res = await fetch(
        `${BRIGHTCALL_API}/api/v3/stat/calls/list?${params}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(dayFrom, dayTo, i)),
        }
      )
      const data = await res.json()

      if (data?.calls?.length) {
        const formatted = data.calls.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          timestamp: c.timestamp,
          state: c.state,
          clientNumber: c.clientNumber || '',
          talkTime: c.talkTime || 0,
          totalTime: c.totalTime || 0,
          outcomeTag: c.outcomeTag || '',
          involvedAgent1Id: String(c.involvedAgent1Id || c.userId || ''),
          tags: c.tags || [],
        }))

        const { error } = await supabase
          .from('calls')
          .upsert(formatted, { onConflict: 'id' })

        if (error) {
          console.error(`[sync-calls] Upsert error on page ${i}:`, error)
        } else {
          totalSynced += formatted.length
          console.log(`[sync-calls] Page ${i}/${pages} — synced ${formatted.length} calls`)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: totalSynced, from: dayFrom, to: dayTo }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[sync-calls] Fatal error:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
