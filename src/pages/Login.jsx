import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import dejavuLogo from '../assets/dejavu-logo.png'

const AUTH_EMAIL = import.meta.env.VITE_AUTH_EMAIL

export default function Login() {
  useTheme()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: AUTH_EMAIL, password })
    if (error) setError('Invalid access code. Please try again.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-xs">

        <div className="flex justify-center mb-8">
          <img src={dejavuLogo} alt="Deja Vu Real Estate" className="h-24 w-auto object-contain dark:invert" />
        </div>

        <div className="rounded-2xl border p-8 shadow-xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--bd-card)' }}>
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Dashboard Access</h1>
          <p className="text-xs text-slate-400 mb-6">Enter your access code to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Access Code
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  style={{ borderColor: error ? 'rgba(239,68,68,0.4)' : 'var(--bd-card)' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {loading ? 'Verifying…' : 'Access Dashboard'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
