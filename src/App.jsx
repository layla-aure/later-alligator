import { useState, useCallback, useRef } from 'react'
import './App.css'

const UNITS = ['minutes', 'hours', 'days', 'years']

function toLocalDateTimeString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`
}

function addIntervalToDate(date, quantity, unit) {
  const ms = date.getTime()
  const qty = Number(quantity)
  if (!qty) return date
  switch (unit) {
    case 'minutes': return new Date(ms + qty * 60_000)
    case 'hours':   return new Date(ms + qty * 3_600_000)
    case 'days':    return new Date(ms + qty * 86_400_000)
    case 'years': {
      const d = new Date(date)
      d.setFullYear(d.getFullYear() + qty)
      return d
    }
    default: return date
  }
}

function computeEndTime(startDate, intervals) {
  return intervals.reduce(
    (acc, { quantity, unit }) => addIntervalToDate(acc, quantity, unit),
    startDate
  )
}

function formatDisplay(date) {
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [text])

  return (
    <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy} aria-label="Copy ending time">
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  )
}



function App() {
  const [startValue, setStartValue] = useState(() => toLocalDateTimeString(new Date()))
  const [intervals, setIntervals] = useState([])

  const startDate = new Date(startValue)
  const endDate = computeEndTime(startDate, intervals)

  const addInterval = useCallback(() => {
    setIntervals(prev => [...prev, { id: nextId++, quantity: 1, unit: 'hours' }])
  }, [])

  const removeInterval = useCallback((id) => {
    setIntervals(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateInterval = useCallback((id, field, value) => {
    setIntervals(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }, [])

  return (
    <div className="app">
      <header>
        <h1>🐊 Later Alligator</h1>
        <p className="subtitle">Calculate a future time by adding intervals</p>
      </header>

      <section className="card">
        <h2>Starting Time</h2>
        <input
          type="datetime-local"
          step="1"
          value={startValue}
          onChange={e => setStartValue(e.target.value)}
          className="datetime-input"
        />
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Intervals</h2>
          <button className="btn-add" onClick={addInterval}>+ Add Interval</button>
        </div>

        {intervals.length === 0 && (
          <p className="empty-msg">No intervals added yet. Click "+ Add Interval" to start.</p>
        )}

        <ul className="interval-list">
          {intervals.map((interval, idx) => (
            <li key={interval.id} className="interval-row">
              <span className="interval-index">#{idx + 1}</span>
              <input
                type="number"
                min="1"
                value={interval.quantity}
                onChange={e => updateInterval(interval.id, 'quantity', e.target.value)}
                className="qty-input"
              />
              <select
                value={interval.unit}
                onChange={e => updateInterval(interval.id, 'unit', e.target.value)}
                className="unit-select"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <button
                className="btn-remove"
                onClick={() => removeInterval(interval.id)}
                aria-label="Remove interval"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card result-card">
        <h2>Ending Time</h2>
        <div className="end-time-row">
          <div className="end-time">{formatDisplay(endDate)}</div>
          <CopyButton text={formatDisplay(endDate)} />
        </div>
      </section>
    </div>
  )
}

export default App
