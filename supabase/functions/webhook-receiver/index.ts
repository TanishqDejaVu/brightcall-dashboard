const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// We only care when a call finishes — that's when we trigger a fresh sync
const TRIGGER_EVENTS = new Set(['callEnded', 'webphoneSummary'])

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventType = payload.eventType as string

  // Skip non-relevant events (e.g. callStarted)
  if (!TRIGGER_EVENTS.has(eventType)) {
    return new Response(JSON.stringify({ skipped: true, eventType }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[webhook-receiver] ${eventType} received — triggering sync`)

  // Trigger sync-calls to fetch fresh data from Brightcall API with correct IDs
  // Fire-and-forget: don't await so webhook responds instantly to Brightcall
  const syncUrl = `${SUPABASE_URL}/functions/v1/sync-calls`
  fetch(syncUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  }).catch(err => console.error('[webhook-receiver] Failed to trigger sync:', err))

  return new Response(JSON.stringify({ success: true, eventType, action: 'sync triggered' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
