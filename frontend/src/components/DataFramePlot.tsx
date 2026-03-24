import React from 'react'
import Plot from 'react-plotly.js'

type DF = Array<Record<string, any>>

function isDateString(v: any) {
  if (v instanceof Date) return true
  if (typeof v !== 'string') return false
  // simple ISO-ish detection
  return /\d{4}-\d{2}-\d{2}/.test(v)
}

function DataFramePlot({ data, title }: { data: DF; title?: string }) {
  if (!data || data.length === 0) return <div>No data to plot</div>

  const firstRow = data[0]
  const keys = Object.keys(firstRow)
  const xKey = keys[0]

  const x = data.map(r => r[xKey])

  const traces = keys.slice(1).map(k => {
    const y = data.map(r => (typeof r[k] === 'number' ? r[k] : parseFloat(r[k])))
    return {
      x,
      y,
      name: k,
      mode: 'lines',
      type: 'scatter',
      marker: { size: 0 },
      line: { width: 2 },
      connectgaps: true
    }
  })

  const layout = {
    title: title ?? 'DataFrame plot',
    xaxis: { title: xKey, type: isDateString(x[0]) ? 'date' : 'category' },
    yaxis: { title: 'value' },
    legend: { orientation: 'h' },
    hovermode: 'x unified',
    margin: { t: 40, b: 40, l: 60, r: 20 }
  }

  return (
    <div className="plot-wrapper">
      <Plot data={traces} layout={layout as any} style={{ width: '100%', height: '100%' }} useResizeHandler config={{ responsive: true, displaylogo: false }} />
    </div>
  )
}

export default DataFramePlot
