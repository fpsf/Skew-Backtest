import React, { useState, useRef } from 'react'
import DataFramePlot from './components/DataFramePlot'

type DF = Array<Record<string, any>>

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000'

function rowsToFrame(rows: Array<Record<string, any>>): DF {
  // rows are [{date: '2023-01-01', col1: val, ...}]
  return rows.map(r => r)
}

function App() {
  const [frames, setFrames] = useState<Record<string, DF>>({})
  const [selected, setSelected] = useState<'df' | 'df_cum'>('df')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ lastRefresh?: string; dfRows?: number; dfCumRows?: number; lastError?: string }>({})
  const [toasts, setToasts] = useState<Array<{ id: number; type: 'success' | 'error' | 'info'; message: string }>>([])
  const toastSeq = useRef(0)

  function addToast(type: 'success' | 'error' | 'info', message: string, ms = 5000) {
    const id = Date.now() + (toastSeq.current++)
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ms)
  }

  function removeToast(id: number) {
    setToasts(t => t.filter(x => x.id !== id))
  }

  async function fetchData(which: 'df' | 'df_cum') {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/data?which=${which}`)
      if (!res.ok) throw new Error(`server returned ${res.status}`)
      const json = await res.json()
      const rows = json.rows || []
      const frame = rowsToFrame(rows)
      setFrames(prev => ({ ...prev, [which]: frame }))
      // update rows count in status
      setStatus(prev => ({ ...prev, ...(which === 'df' ? { dfRows: rows.length } : { dfCumRows: rows.length }) }))
      return rows.length
    } catch (err: any) {
      const msg = err?.message || String(err)
      setStatus(prev => ({ ...prev, lastError: `Fetch ${which} failed: ${msg}` }))
      addToast('error', `Failed to fetch ${which}: ${msg}`)
      return 0
    } finally {
      setLoading(false)
    }
  }

  async function refreshServer() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'refresh failed')
      // mark last refresh time
      const now = new Date().toISOString()
      setStatus(prev => ({ ...prev, lastRefresh: now }))
      // reload both datasets after refresh
      const [dfCount, dfCumCount] = await Promise.all([fetchData('df'), fetchData('df_cum')])
      setStatus(prev => ({ ...prev, lastRefresh: now, dfRows: dfCount, dfCumRows: dfCumCount }))
      addToast('success', 'Refresh complete')
    } catch (err: any) {
      const msg = err?.message || String(err)
      setStatus(prev => ({ ...prev, lastError: `Refresh failed: ${msg}` }))
      addToast('error', `Refresh failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // on mount, load the default Daily PnL (df)
  React.useEffect(() => {
    // preload both datasets on mount (Daily PnL shown by default)
    ;(async () => {
      setLoading(true)
      try {
        const [dfCount, dfCumCount] = await Promise.all([fetchData('df'), fetchData('df_cum')])
        setStatus({ dfRows: dfCount, dfCumRows: dfCumCount })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const options = [
    { value: 'df', label: 'Daily PnL' },
    { value: 'df_cum', label: 'Cumulative PnL' }
  ]

  const currentFrame = frames[selected]
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'

  return (
    <div className="container">
      <h1>Skew Backtest Viewer</h1>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
            {t.message}
          </div>
        ))}
      </div>

      <div className="controls">
        <label>Choose dataset:
          <select value={selected} onChange={e => setSelected(e.target.value as 'df' | 'df_cum')}>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button onClick={refreshServer} disabled={loading} aria-busy={loading}>
          {loading ? 'Refreshing…' : 'Refresh Data'}
          {loading && <span className="spinner" aria-hidden="true" />}
        </button>
      </div>

      <div className="plot-area">
        {currentFrame && currentFrame.length > 0 ? (
          <DataFramePlot data={currentFrame} title={options.find(o => o.value === selected)?.label} />
        ) : (
          <div className="placeholder">Loading {selected === 'df' ? 'Daily' : 'Cumulative'} PnL...</div>
        )}
      </div>
    </div>
  )
}

export default App
