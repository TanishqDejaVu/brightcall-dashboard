import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllCalls, computeMetrics } from '../api/brightcall'
import { format, subDays, subMonths, subYears } from 'date-fns'

const CACHE_KEY = 'bc_metrics_v1'

function getDateRange(range) {
  const today = new Date()
  const fmt = d => format(d, 'yyyy-MM-dd')
  if (range === '1d' || range === 'today') return { startDate: fmt(today), endDate: fmt(today) }
  if (range === '1w' || range === '7d')    return { startDate: fmt(subDays(today, 7)), endDate: fmt(today) }
  if (range === '1m' || range === '30d')   return { startDate: fmt(subMonths(today, 1)), endDate: fmt(today) }
  if (range === '6m')   return { startDate: fmt(subMonths(today, 6)), endDate: fmt(today) }
  if (range === 'all')  return { startDate: fmt(subYears(today, 5)), endDate: fmt(today) }
  return { startDate: range.start, endDate: range.end }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

export function useDashboard(dateRange = '1w', selectedAgent = 'all') {
  const [cached]                      = useState(() => readCache())
  const [data, setData]               = useState(cached)           // show cache instantly
  const [loading, setLoading]         = useState(cached === null)  // skeleton only on first ever visit
  const [refreshing, setRefreshing]   = useState(false)
  const [progress, setProgress]       = useState({ done: 0, total: 0 })
  const [error, setError]             = useState(null)
  const [lastUpdated, setLastUpdated] = useState(cached ? new Date() : null)
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    const hasCache = readCache() !== null
    if (hasCache) setRefreshing(true)
    else          setLoading(true)
    setError(null)
    setProgress({ done: 0, total: 0 })
    try {
      const { startDate, endDate } = getDateRange(dateRange)
      const calls = await fetchAllCalls(startDate, endDate, (done, total) => {
        setProgress({ done, total })
      })
      const filteredCalls = selectedAgent === 'all' 
        ? calls 
        : calls.filter(c => String(c.involvedAgent1Id || c.userId) === String(selectedAgent))
      
      const metrics = computeMetrics(filteredCalls)
      writeCache(metrics)
      setData(metrics)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message === 'INVALID_API_KEY' ? 'INVALID_API_KEY' : 'FETCH_ERROR')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange, selectedAgent])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, 300000) // refresh every 5 min
    return () => clearInterval(timerRef.current)
  }, [load])

  return { data, loading, refreshing, progress, error, lastUpdated, refetch: load }
}
