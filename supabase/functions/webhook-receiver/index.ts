import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Events we care about — callEnded has full call data, webphoneSummary has the outcome tag
const RELEVANT_EVENTS = new Set(['callEnded', 'webphoneSummary'])

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

  // Ignore events we don't need
  if (!RELEVANT_EVENTS.has(eventType)) {
    return new Response(JSON.stringify({ skipped: true, eventType }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[webhook-receiver] Received ${eventType} for call ID: ${payload.id}`)

  // Normalize the call record from the webhook payload
  const call = {
    id: String(payload.id),
    timestamp: payload.timestamp,
    state: payload.state,
    clientNumber: payload.clientNumber || payload.toNumber || '',
    talkTime: payload.talkTime || 0,
    totalTime: payload.totalTime || payload.callTime || 0,
    outcomeTag: payload.outcomeTag || '',
    involvedAgent1Id: String(payload.involvedAgent1Id || payload.userId || ''),
    tags: payload.tags || [],
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { error } = await supabase
    .from('calls')
    .upsert(call, { onConflict: 'id' })

  if (error) {
    console.error('[webhook-receiver] Upsert error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[webhook-receiver] Upserted call ${call.id} (${eventType})`)
  return new Response(JSON.stringify({ success: true, id: call.id, eventType }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
