import { NOW } from '../data/mock.js'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

export const TIMEZONES = {
  WIB: { label: 'WIB (UTC+7)', tz: 'Asia/Jakarta', offset: 7 },
  WITA: { label: 'WITA (UTC+8)', tz: 'Asia/Makassar', offset: 8 },
  WIT: { label: 'WIT (UTC+9)', tz: 'Asia/Jayapura', offset: 9 },
}

export const SENSORS = {
  temperature: { label: 'Suhu', unit: '°C', digits: 1 },
  voltage: { label: 'Tegangan', unit: 'V', digits: 2 },
  current: { label: 'Arus', unit: 'A', digits: 2 },
  power: { label: 'Daya', unit: 'W', digits: 1 },
  irradiance: { label: 'Irradiance', unit: 'W/m²', digits: 0 },
}

export const LINK_METRICS = {
  rssi: { label: 'RSSI', unit: 'dBm', digits: 0 },
  snr: { label: 'SNR', unit: 'dB', digits: 1 },
  packet_loss: { label: 'Packet loss', unit: '%', digits: 1 },
}

export const ALL_METRICS = { ...SENSORS, ...LINK_METRICS }

const cache = new Map()
function formatter(zone, options) {
  const key = zone + JSON.stringify(options)
  if (!cache.has(key)) {
    cache.set(
      key,
      new Intl.DateTimeFormat('id-ID', { timeZone: TIMEZONES[zone].tz, ...options }),
    )
  }
  return cache.get(key)
}

export function fmtDateTime(ts, zone = 'WIB') {
  if (!ts) return '—'
  const text = formatter(zone, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
  return `${text} ${zone}`
}

export function fmtTime(ts, zone = 'WIB') {
  return formatter(zone, { hour: '2-digit', minute: '2-digit' }).format(ts)
}

export function fmtDay(ts, zone = 'WIB') {
  return formatter(zone, { day: '2-digit', month: 'short' }).format(ts)
}

export function fmtWeekday(ts, zone = 'WIB') {
  return formatter(zone, { weekday: 'short' }).format(ts)
}

export function relTime(ts) {
  if (!ts) return 'belum ada data'
  const minutes = Math.floor((NOW - ts) / 60000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

export function fmtNum(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function alertText(alert) {
  if (alert.jenis === 'offline') return 'Perangkat offline — tidak mengirim data'
  const sensor = SENSORS[alert.sensor]
  const side = alert.batas === 'max' ? 'di atas' : 'di bawah'
  return `${sensor.label} ${fmtNum(alert.nilai, sensor.digits)} ${sensor.unit} ${side} ambang ${fmtNum(alert.ambang, sensor.digits)} ${sensor.unit}`
}

/** Tanggal hari ini (YYYY-MM-DD) menurut zona waktu pengaturan. */
export function dayString(ts, zone) {
  return new Date(ts + TIMEZONES[zone].offset * 3600000).toISOString().slice(0, 10)
}

/** Awal hari (00:00) dari string YYYY-MM-DD di zona waktu pengaturan, sebagai timestamp UTC. */
export function dayStart(text, zone) {
  return Date.parse(`${text}T00:00:00Z`) - TIMEZONES[zone].offset * 3600000
}
