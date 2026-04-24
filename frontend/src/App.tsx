import React, { useRef, useState } from 'react'
import Papa from 'papaparse'

type DF = Array<Record<string, any>>
type DatasetKey = 'df' | 'df_cum'
type DataMode = 'api' | 'static'

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://localhost:5002').replace(/\/$/, '')
const DATA_MODE = (import.meta.env.VITE_DATA_MODE ?? (import.meta.env.PROD ? 'static' : 'api')) as DataMode
const BASE_URL = import.meta.env.BASE_URL

const DATASETS: Record<DatasetKey, { label: string; asset: string }> = {
  df: { label: 'Daily PnL', asset: 'df.csv' },
  df_cum: { label: 'Cumulative PnL', asset: 'df_cum.csv' }
}

const DataFramePlot = React.lazy(() => import('./components/DataFramePlot'))

type Status = {
  lastRefresh?: string
  dfRows?: number
  dfCumRows?: number
  exportedAt?: string
  lastError?: string
}

type Manifest = {
  exported_at?: string
  datasets?: Partial<Record<DatasetKey, { rows?: number }>>
}

function rowsToFrame(rows: Array<Record<string, any>>): DF {
  return rows.map(r => r)
}

function csvUrl(fileName: string) {
  return `${BASE_URL}${fileName}`
}

function parseCsv(text: string): DF {
  const parsed = Papa.parse<Record<string, any>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message)
  }

  return parsed.data
}

function App() {
  const [frames, setFrames] = useState<Record<string, DF>>({})
  const [selected, setSelected] = useState<DatasetKey>('df')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>({})
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

  async function loadManifest() {
    try {
      const res = await fetch(csvUrl('dataset-manifest.json'))
      if (!res.ok) return
      const manifest = (await res.json()) as Manifest

      setStatus(prev => ({
        ...prev,
        exportedAt: manifest.exported_at,
        dfRows: manifest.datasets?.df?.rows ?? prev.dfRows,
        dfCumRows: manifest.datasets?.df_cum?.rows ?? prev.dfCumRows
      }))
    } catch (err: any) {
      console.warn('Unable to load manifest', err)
    }
  }

  async function loadStaticData(which: DatasetKey) {
    try {
      const res = await fetch(csvUrl(DATASETS[which].asset))
      if (!res.ok) throw new Error(`asset returned ${res.status}`)
      const text = await res.text()
      const rows = parseCsv(text)
      const frame = rowsToFrame(rows)
      setFrames(prev => ({ ...prev, [which]: frame }))
      setStatus(prev => ({ ...prev, lastError: undefined, ...(which === 'df' ? { dfRows: rows.length } : { dfCumRows: rows.length }) }))
      return rows.length
    } catch (err: any) {
      const msg = err?.message || String(err)
      setStatus(prev => ({ ...prev, lastError: `Static load ${which} failed: ${msg}` }))
      addToast('error', `Failed to load ${which} CSV: ${msg}`)
      return 0
    }
  }

  async function loadApiData(which: DatasetKey) {
    try {
      const res = await fetch(`${API_BASE}/api/data?which=${which}`)
      if (!res.ok) throw new Error(`server returned ${res.status}`)
      const json = await res.json()
      const rows = json.rows || []
      const frame = rowsToFrame(rows)
      setFrames(prev => ({ ...prev, [which]: frame }))
      setStatus(prev => ({ ...prev, lastError: undefined, ...(which === 'df' ? { dfRows: rows.length } : { dfCumRows: rows.length }) }))
      return rows.length
    } catch (err: any) {
      const msg = err?.message || String(err)
      setStatus(prev => ({ ...prev, lastError: `Fetch ${which} failed: ${msg}` }))
      addToast('error', `Failed to fetch ${which}: ${msg}`)
      return 0
    }
  }

  async function fetchData(which: DatasetKey) {
    return DATA_MODE === 'static' ? loadStaticData(which) : loadApiData(which)
  }

  async function refreshServer() {
    if (DATA_MODE !== 'api') {
      addToast('info', 'Static GitHub Pages mode is active. Run the export workflow or export script to refresh data.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'refresh failed')
      const now = new Date().toISOString()
      const [dfCount, dfCumCount] = await Promise.all([fetchData('df'), fetchData('df_cum')])
      setStatus(prev => ({ ...prev, lastError: undefined, lastRefresh: now, dfRows: dfCount, dfCumRows: dfCumCount }))
      addToast('success', 'Refresh complete')
    } catch (err: any) {
      const msg = err?.message || String(err)
      setStatus(prev => ({ ...prev, lastError: `Refresh failed: ${msg}` }))
      addToast('error', `Refresh failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        await loadManifest()
        const [dfCount, dfCumCount] = await Promise.all([fetchData('df'), fetchData('df_cum')])
        setStatus(prev => ({ ...prev, dfRows: dfCount, dfCumRows: dfCumCount }))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const currentFrame = frames[selected]
  const options = Object.entries(DATASETS).map(([value, meta]) => ({ value: value as DatasetKey, label: meta.label }))
  const isStaticMode = DATA_MODE === 'static'

  return (
    <div className="container">
      <h1>Skew Backtest Viewer</h1>
      <p className="subtitle">
        Built for GitHub Pages with static datasets by default, while keeping the Flask API available for local refreshes.
      </p>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
            {t.message}
          </div>
        ))}
      </div>

      <div className="controls">
        <div className="mode-card">
          <span className={`mode-badge ${isStaticMode ? 'mode-static' : 'mode-api'}`}>
            {isStaticMode ? 'GitHub Pages mode' : 'Backend API mode'}
          </span>
          <span className="mode-detail">
            {isStaticMode ? `Loading CSV assets from ${BASE_URL}` : `Using backend ${API_BASE}`}
          </span>
          {status.exportedAt && (
            <span className="mode-detail">
              Last export: {new Date(status.exportedAt).toLocaleString()}
            </span>
          )}
          {(status.dfRows !== undefined || status.dfCumRows !== undefined) && (
            <span className="mode-detail">
              Rows loaded: daily {status.dfRows ?? 0}, cumulative {status.dfCumRows ?? 0}
            </span>
          )}
        </div>
        <label>Choose dataset:
          <select value={selected} onChange={e => setSelected(e.target.value as DatasetKey)}>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button onClick={refreshServer} disabled={loading || isStaticMode} aria-busy={loading}>
          {isStaticMode ? 'Static Export Required' : (loading ? 'Refreshing…' : 'Refresh Data')}
          {loading && <span className="spinner" aria-hidden="true" />}
        </button>
      </div>

      {status.lastError && <div className="error-panel">{status.lastError}</div>}

      <div className="plot-area">
        {currentFrame && currentFrame.length > 0 ? (
          <React.Suspense fallback={<div className="placeholder">Preparing chart...</div>}>
            <DataFramePlot data={currentFrame} title={options.find(o => o.value === selected)?.label} />
          </React.Suspense>
        ) : (
          <div className="placeholder">Loading {selected === 'df' ? 'Daily' : 'Cumulative'} PnL...</div>
        )}
      </div>
    </div>
  )
}

export default App
