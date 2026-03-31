import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const BRIGHTCALL_KEY = process.env.BRIGHTCALL_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BRIGHTCALL_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required environment variables!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function fetchAndSync() {
  const today = new Date();
  
  // Script runs daily, fetches last 7 days to cover missed uploads/late updates
  const past = new Date(today);
  past.setDate(past.getDate() - 7);
  
  const dayTo = today.toISOString().split('T')[0];
  const dayFrom = past.toISOString().split('T')[0];

  console.log(`Starting sync from ${dayFrom} to ${dayTo}...`);

  try {
    const params = { 'api-key': BRIGHTCALL_KEY };
    const countRes = await axios.post('https://api.dialer.brightcall.ai/api/v3/stat/calls/count', buildPayload(dayFrom, dayTo), { params });
    const pages = countRes.data?.pagesCount || 1;

    let totalSynced = 0;

    for (let i = 1; i <= pages; i++) {
       console.log(`Fetching page ${i}/${pages}...`);
       const res = await axios.post('https://api.dialer.brightcall.ai/api/v3/stat/calls/list', buildPayload(dayFrom, dayTo, i), { params });
       
       if (res.data && res.data.calls) {
          const formatted = res.data.calls.map(c => ({
             id: String(c.id),
             timestamp: c.timestamp,
             state: c.state,
             clientNumber: c.clientNumber || '',
             talkTime: c.talkTime || 0,
             totalTime: c.totalTime || 0,
             outcomeTag: c.outcomeTag || '',
             involvedAgent1Id: String(c.involvedAgent1Id || c.userId || ''),
             tags: c.tags || []
          }));

          const { error } = await supabase.from('calls').upsert(formatted, { onConflict: 'id' });
          if (error) {
              console.error("Supabase upsert error:", error);
          } else {
              totalSynced += formatted.length;
          }
       }
    }
    
    console.log(`Successfully synced ${totalSynced} calls to Supabase!`);
  } catch (error) {
    console.error("Sync workflow failed:", error.message);
    process.exit(1);
  }
}

fetchAndSync();
