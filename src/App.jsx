import { useState, useCallback, useRef, useEffect } from 'react'
import './App.css'

const UNITS = ['seconds', 'minutes', 'hours', 'days', 'fortnights', 'years']

const T = {
  en: {
    subtitle:   '// craft your future timestamp //',
    startTime:  'Starting Time',
    intervals:  'Intervals',
    addBtn:     '+ Add Interval',
    empty:      'No intervals yet. Click "+ Add Interval" to start.',
    endTime:    'Ending Time',
    copy:       '⎘ Copy',
    copied:     '✓ Copied',
    units: {
      seconds:    'seconds',
      minutes:    'minutes',
      hours:      'hours',
      days:       'days',
      fortnights: 'fortnights',
      years:      'years',
    },
  },
  es: {
    subtitle:   '// construye tu marca de tiempo futura //',
    startTime:  'Hora de inicio',
    intervals:  'Intervalos',
    addBtn:     '+ Agregar intervalo',
    empty:      'Sin intervalos. Haz clic en "+ Agregar intervalo" para empezar.',
    endTime:    'Hora de fin',
    copy:       '⎘ Copiar',
    copied:     '✓ Copiado',
    units: {
      seconds:    'segundos',
      minutes:    'minutos',
      hours:      'horas',
      days:       'días',
      fortnights: 'quincenas',
      years:      'años',
    },
  },
}

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
    case 'seconds':    return new Date(ms + qty * 1_000)
    case 'minutes':    return new Date(ms + qty * 60_000)
    case 'hours':      return new Date(ms + qty * 3_600_000)
    case 'days':       return new Date(ms + qty * 86_400_000)
    case 'fortnights': return new Date(ms + qty * 14 * 86_400_000)
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

let nextId = 1

function CustomSelect({ value, options, getLabel, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select__trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{getLabel(value)}</span>
        <span className="custom-select__arrow">▼</span>
      </button>
      {open && (
        <ul className="custom-select__dropdown">
          {options.map(opt => (
            <li
              key={opt}
              className={`custom-select__option ${opt === value ? 'selected' : ''}`}
              onMouseDown={() => { onChange(opt); setOpen(false) }}
            >
              {getLabel(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CopyButton({ t, text }) {
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
      {copied ? t.copied : t.copy}
    </button>
  )
}

function App() {
  const [lang, setLang] = useState('en')
  const [startValue, setStartValue] = useState(() => toLocalDateTimeString(new Date()))
  const [intervals, setIntervals] = useState([])

  const t = T[lang]
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
        <div className="lang-toggle">
          <button className={`btn-lang ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`btn-lang ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>ES</button>
        </div>
        <h1>⛏ Later Alligator</h1>
        <p className="subtitle">{t.subtitle}</p>
      </header>

      <section className="card">
        <h2>{t.startTime}</h2>
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
          <h2>{t.intervals}</h2>
          <button className="btn-add" onClick={addInterval}>{t.addBtn}</button>
        </div>

        {intervals.length === 0 && (
          <p className="empty-msg">{t.empty}</p>
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
              <CustomSelect
                value={interval.unit}
                options={UNITS}
                getLabel={u => t.units[u]}
                onChange={val => updateInterval(interval.id, 'unit', val)}
              />
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
        <h2>{t.endTime}</h2>
        <div className="end-time-row">
          <div className="end-time">{formatDisplay(endDate)}</div>
          <CopyButton t={t} text={formatDisplay(endDate)} />
        </div>
      </section>
    </div>
  )
}

export default App
