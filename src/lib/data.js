import { NOW } from '../data/mock.js'
import { SENSORS, TIMEZONES } from './format.js'

const BUCKETS = [5, 15, 30, 60, 120, 180, 360].map((m) => m * 60000)

/** Rata-rata per rentang waktu. Rentang tanpa data bernilai null agar celah terlihat di grafik. */
export function bucketSeries(rows, key, from, to, target = 96) {
  const span = to - from
  const size = BUCKETS.find((s) => span / s <= target) ?? BUCKETS.at(-1)
  const n = Math.max(1, Math.ceil(span / size))
  const sum = Array(n).fill(0)
  const count = Array(n).fill(0)
  for (const row of rows) {
    if (row.recorded_at < from || row.recorded_at >= to) continue
    const i = Math.floor((row.recorded_at - from) / size)
    sum[i] += row[key]
    count[i]++
  }
  return sum.map((s, i) => ({ t: from + i * size, value: count[i] ? s / count[i] : null }))
}

/** Rata-rata harian untuk N hari terakhir, mengikuti batas hari di zona waktu pengaturan. */
export function dailySeries(rows, key, days, zone) {
  const shift = TIMEZONES[zone].offset * 3600000
  const today = Math.floor((NOW + shift) / 86400000)
  const first = today - days + 1
  const sum = Array(days).fill(0)
  const count = Array(days).fill(0)
  for (const row of rows) {
    const i = Math.floor((row.recorded_at + shift) / 86400000) - first
    if (i < 0 || i >= days) continue
    sum[i] += row[key]
    count[i]++
  }
  return sum.map((s, i) => ({
    t: (first + i) * 86400000 - shift,
    value: count[i] ? s / count[i] : null,
  }))
}

export function exportCsv({ rows, devices, settings, sensors = Object.keys(SENSORS), filename }) {
  const semicolon = settings.exportFormat === 'semicolon'
  const sep = semicolon ? ';' : ','
  const offset = TIMEZONES[settings.timezone].offset
  const num = (v) => (v == null ? '' : semicolon ? String(v).replace('.', ',') : String(v))
  const time = (ts) =>
    settings.exportTime === 'utc'
      ? new Date(ts).toISOString().slice(0, 19) + 'Z'
      : new Date(ts + offset * 3600000).toISOString().slice(0, 19) + `+0${offset}:00`
  const byId = Object.fromEntries(devices.map((d) => [d.id, d]))

  const header = ['timestamp', 'node_id', 'perangkat', 'packet_no', ...sensors, 'rssi', 'snr', 'packet_loss']
  const lines = rows.map((row) => {
    const device = byId[row.device_id]
    return [
      time(row.recorded_at),
      device?.node_id ?? '',
      `"${(device?.nama ?? '').replaceAll('"', '""')}"`,
      row.packet_no,
      ...sensors.map((s) => num(row[s])),
      row.rssi,
      num(row.snr),
      num(row.packet_loss),
    ].join(sep)
  })

  const blob = new Blob(['﻿' + [header.join(sep), ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
