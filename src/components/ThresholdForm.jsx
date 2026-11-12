import { useState } from 'react'
import { useApp } from '../context/store.js'
import { SENSORS, fmtNum } from '../lib/format.js'
import { Button, Input } from './ui.jsx'

const toText = (v) => (v == null ? '' : String(v))
const toNumber = (text) => (text.trim() === '' ? null : Number(text.replace(',', '.')))

/**
 * Form ambang batas bawah/atas per sensor.
 * scope = 'global' atau id perangkat. Untuk perangkat, kolom kosong berarti mengikuti ambang global.
 * Beri `key={scope}` saat memakai agar isian direset ketika cakupan berganti.
 */
export default function ThresholdForm({ scope, readOnly }) {
  const { thresholds, saveThresholds } = useApp()
  const isGlobal = scope === 'global'
  const source = isGlobal ? thresholds.global : (thresholds.devices[scope] ?? {})
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.keys(SENSORS).map((s) => [s, { min: toText(source[s]?.min), max: toText(source[s]?.max) }]),
    ),
  )
  const [error, setError] = useState('')

  const set = (sensor, side, text) =>
    setValues((v) => ({ ...v, [sensor]: { ...v[sensor], [side]: text } }))

  const submit = (e) => {
    e.preventDefault()
    const parsed = {}
    for (const [sensor, { min, max }] of Object.entries(values)) {
      const lo = toNumber(min)
      const hi = toNumber(max)
      const label = SENSORS[sensor].label
      if (Number.isNaN(lo) || Number.isNaN(hi)) return setError(`${label}: isi dengan angka.`)
      if (isGlobal && (lo == null || hi == null)) return setError(`${label}: ambang global wajib diisi.`)
      const effLo = lo ?? thresholds.global[sensor].min
      const effHi = hi ?? thresholds.global[sensor].max
      if (effLo >= effHi) return setError(`${label}: batas bawah harus lebih kecil dari batas atas.`)
      if (lo != null || hi != null) parsed[sensor] = { min: lo, max: hi }
    }
    setError('')
    saveThresholds(scope, parsed)
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-[1fr_9rem_9rem] sm:items-center">
        <span className="hidden text-xs font-medium text-muted sm:block">Sensor</span>
        <span className="hidden text-xs font-medium text-muted sm:block">Batas bawah</span>
        <span className="hidden text-xs font-medium text-muted sm:block">Batas atas</span>
        {Object.entries(SENSORS).map(([key, sensor]) => {
          const base = thresholds.global[key]
          return (
            <div key={key} className="contents">
              <span className="text-sm font-medium">
                {sensor.label} <span className="font-normal text-muted">({sensor.unit})</span>
              </span>
              {['min', 'max'].map((side) => (
                <Input
                  key={side}
                  inputMode="decimal"
                  disabled={readOnly}
                  value={values[key][side]}
                  onChange={(e) => set(key, side, e.target.value)}
                  aria-label={`${sensor.label} batas ${side === 'min' ? 'bawah' : 'atas'}`}
                  placeholder={isGlobal ? '' : `Global: ${fmtNum(base[side], sensor.digits)}`}
                />
              ))}
            </div>
          )
        })}
      </div>
      {!isGlobal && (
        <p className="mt-3 text-xs text-muted">Kolom yang dikosongkan mengikuti ambang global.</p>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {!readOnly && (
        <Button type="submit" className="mt-4">
          Simpan ambang
        </Button>
      )}
    </form>
  )
}
