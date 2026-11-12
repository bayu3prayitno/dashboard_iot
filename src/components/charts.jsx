import { useId } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { TIMEZONES, fmtDateTime, fmtDay, fmtNum, fmtTime, fmtWeekday } from '../lib/format.js'
import { Empty } from './ui.jsx'

const AXIS = { fontSize: 11, fill: '#6f766f' }
const GRID = '#eceeea'
const DARK = '#262a26'
const LIME = '#a8d93a'
const LIME_DARK = '#6f9f12'

function Tip({ active, payload, title, metric }) {
  const point = payload?.[0]?.payload
  if (!active || !point || point.value == null) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{title(point.t)}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">
        {fmtNum(point.value, metric.digits)} {metric.unit}
      </p>
    </div>
  )
}

const hasData = (data) => data.some((d) => d.value != null)

/** Grafik garis satu seri; rentang tanpa data dibiarkan terputus. */
export function LineTrend({ data, metric, zone, height = 260 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  if (!hasData(data)) return <Empty>Belum ada data pada rentang ini.</Empty>
  const first = data[0].t
  const last = data.at(-1).t
  const longRange = last - first > 36 * 3600000
  // Tick di jam bulat (tiap 3 jam) atau tengah malam (tiap hari) menurut zona waktu tampilan
  const step = (longRange ? 24 : 3) * 3600000
  const shift = TIMEZONES[zone].offset * 3600000
  const ticks = []
  for (let t = Math.ceil((first + shift) / step) * step - shift; t <= last; t += step) ticks.push(t)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIME} stopOpacity={0.45} />
            <stop offset="100%" stopColor={LIME} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={ticks}
          tickFormatter={(t) => (longRange ? fmtDay(t, zone) : fmtTime(t, zone))}
          tick={AXIS} axisLine={false} tickLine={false} minTickGap={48}
        />
        <YAxis
          width={48} tick={AXIS} axisLine={false} tickLine={false}
          domain={['auto', 'auto']} tickFormatter={(v) => fmtNum(v, v % 1 ? 1 : 0)}
        />
        <Tooltip
          cursor={{ stroke: '#b9c2bd' }} isAnimationActive={false}
          content={<Tip metric={metric} title={(t) => fmtDateTime(t, zone)} />}
        />
        <Area
          type="monotone" dataKey="value" stroke={LIME_DARK} strokeWidth={2} fill={`url(#${id})`}
          dot={false} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
          connectNulls={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Garis mini tanpa sumbu untuk kartu ringkasan. */
export function Sparkline({ data, className }) {
  const points = data.filter((d) => d.value != null)
  if (points.length < 2) return null
  const values = points.map((d) => d.value)
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const path = points
    .map((d, i) => `${i ? 'L' : 'M'}${((i / (points.length - 1)) * 100).toFixed(1)} ${(26 - ((d.value - min) / span) * 24).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={path} fill="none" stroke={LIME_DARK} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

/** Grafik batang rata-rata harian; batang tertinggi diberi aksen hijau limau. */
export function DailyBars({ data, metric, zone, height = 260 }) {
  if (!hasData(data)) return <Empty>Belum ada data pada rentang ini.</Empty>
  const max = Math.max(...data.map((d) => d.value ?? -Infinity))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="t" tickFormatter={(t) => fmtWeekday(t, zone)}
          tick={AXIS} axisLine={false} tickLine={false}
        />
        <YAxis
          width={48} tick={AXIS} axisLine={false} tickLine={false}
          tickFormatter={(v) => fmtNum(v, v % 1 ? 1 : 0)}
        />
        <Tooltip
          cursor={{ fill: '#f4f5f4' }} isAnimationActive={false}
          content={<Tip metric={metric} title={(t) => `${fmtWeekday(t, zone)}, ${fmtDay(t, zone)}`} />}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={40} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.t} fill={d.value === max ? LIME : DARK} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Gauge setengah lingkaran untuk satu persentase. */
export function Gauge({ percent, label }) {
  const length = Math.PI * 80
  const filled = percent == null ? 0 : (length * Math.min(100, Math.max(0, percent))) / 100
  return (
    <svg viewBox="0 0 200 116" className="mx-auto w-full max-w-64" role="img" aria-label={`${label}: ${percent == null ? 'tidak ada data' : `${Math.round(percent)}%`}`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e7eae8" strokeWidth="20" strokeLinecap="round" />
      {percent != null && (
        <path
          d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={LIME} strokeWidth="20"
          strokeLinecap="round" strokeDasharray={`${filled} ${length}`}
        />
      )}
      <text x="100" y="88" textAnchor="middle" className="fill-ink text-[34px] font-semibold">
        {percent == null ? '—' : `${Math.round(percent)}%`}
      </text>
      <text x="100" y="108" textAnchor="middle" className="fill-muted text-[11px]">
        {label}
      </text>
    </svg>
  )
}
