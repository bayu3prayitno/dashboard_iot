import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, BellRing, Cpu, Download, Globe, Plus, Radio, Server, Wifi, WifiOff } from 'lucide-react'
import { DailyBars, Gauge, LineTrend, Sparkline } from '../components/charts.jsx'
import { Button, Card, CardTitle, Empty, Select, StatusBadge, Table, Tabs, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { NOW } from '../data/mock.js'
import { bucketSeries, dailySeries, exportCsv } from '../lib/data.js'
import { SENSORS, alertText, cx, fmtDateTime, fmtNum, relTime } from '../lib/format.js'

function StatTile({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-3xl bg-white p-4 transition-shadow hover:shadow-md">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-canvas text-muted">
        <Icon size={19} />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl leading-tight font-semibold tabular-nums">{value}</span>
        <span className="block text-xs leading-tight text-muted">{label}</span>
      </span>
    </Link>
  )
}

function GlassCard({ label, value, unit, to, children }) {
  return (
    <div className="glass w-full rounded-2xl p-4 sm:w-48">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-tight font-medium">{label}</p>
        <Link to={to} aria-label={`Lihat histori ${label}`} className="grid size-7 shrink-0 place-items-center rounded-full bg-white shadow-sm">
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value} <span className="text-xs font-medium text-muted">{unit}</span>
      </p>
      <div className="mt-2 h-7">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const {
    visibleDevices, deviceStatus, rowsOf, latestOf, activeAlerts, setAlertStatus,
    gateway, settings, zone, notify,
  } = useApp()
  const navigate = useNavigate()
  const [sensor, setSensor] = useState('power')
  const [range, setRange] = useState('7d')

  const statuses = visibleDevices.map(deviceStatus)
  const online = statuses.filter((s) => s === 'online').length
  const offline = statuses.filter((s) => s === 'offline').length
  const nameOf = (id) => visibleDevices.find((d) => d.id === id)?.nama ?? '—'

  const deviceKey = visibleDevices.map((d) => d.id).join()
  const allRows = useMemo(
    () => visibleDevices.flatMap((d) => rowsOf(d.id)),
    // rowsOf membaca data tiruan statis; id perangkat cukup sebagai dependensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deviceKey],
  )
  const trend = useMemo(
    () =>
      range === '7d'
        ? dailySeries(allRows, sensor, 7, zone)
        : bucketSeries(allRows, sensor, NOW - 86400000, NOW, 48),
    [allRows, sensor, range, zone],
  )
  const power24 = useMemo(() => bucketSeries(allRows, 'power', NOW - 86400000, NOW, 48), [allRows])
  const irradiance24 = useMemo(() => bucketSeries(allRows, 'irradiance', NOW - 86400000, NOW, 48), [allRows])

  // Nilai terkini: rata-rata dari node yang sedang online
  const live = visibleDevices.filter((d) => deviceStatus(d) === 'online').map((d) => latestOf(d.id)).filter(Boolean)
  const avg = (key) => (live.length ? live.reduce((sum, r) => sum + r[key], 0) / live.length : null)
  const powerNow = avg('power')
  const powerPeak = Math.max(0, ...power24.map((d) => d.value ?? 0))
  const powerShare = powerNow != null && powerPeak > 0 ? Math.min(100, (powerNow / powerPeak) * 100) : 0

  const links = visibleDevices
    .map((d) => ({ device: d, row: latestOf(d.id) }))
    .filter((x) => x.row && x.device.aktif)
  const received = links.length
    ? links.reduce((sum, x) => sum + (100 - x.row.packet_loss), 0) / links.length
    : null

  const exportToday = () => {
    const rows = allRows
      .filter((r) => r.recorded_at >= NOW - 86400000)
      .sort((a, b) => b.recorded_at - a.recorded_at)
    if (!rows.length) return notify('Belum ada data untuk diekspor.')
    exportCsv({ rows, devices: visibleDevices, settings, filename: 'omahiot-24-jam-terakhir.csv' })
  }

  return (
    <>
      {/* Banner hero; margin negatif membuat header (cari + notifikasi) menumpang di atasnya */}
      <section className="hero-surface relative -mt-16 mb-4 overflow-hidden rounded-3xl px-5 pt-20 pb-5 sm:px-7 md:min-h-[25rem]">
        <img
          src={`${import.meta.env.BASE_URL}plts-3D.webp`}
          alt=""
          className="pointer-events-none mx-auto -mb-2 h-52 object-contain drop-shadow-xl select-none md:absolute md:top-1/2 md:left-[36%] md:mb-0 md:h-[112%] md:-translate-y-[46%] xl:left-[40%]"
        />
        <div className="relative flex h-full flex-col gap-6 md:min-h-[19rem] md:justify-between">
          <div className="max-w-sm">
            <h1 className="text-3xl leading-tight font-medium tracking-tight uppercase sm:text-4xl">
              Monitoring
              <br />
              PLTS Cerdas
            </h1>
            <p className="mt-2 text-sm text-muted">Pantau node sensor dan gateway LoRa secara real-time.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate('/perangkat', { state: { add: true } })}>
                <Plus size={16} /> Tambah Perangkat
              </Button>
              <Button variant="outline" className="bg-white/60" onClick={exportToday}>
                <Download size={16} /> Ekspor CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <GlassCard label="Daya saat ini" value={fmtNum(powerNow, 1)} unit="W" to="/histori">
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-primary"
                  role="img"
                  aria-label={`${Math.round(powerShare)}% dari puncak 24 jam terakhir`}
                  title={`${Math.round(powerShare)}% dari puncak 24 jam terakhir`}
                >
                  <div className="h-full rounded-full bg-lime" style={{ width: `${powerShare}%` }} />
                </div>
              </GlassCard>
              <GlassCard label="Irradiance" value={fmtNum(avg('irradiance'), 0)} unit="W/m²" to="/histori">
                <Sparkline data={irradiance24} className="h-full w-full" />
              </GlassCard>
            </div>
            <div className="glass flex gap-6 rounded-2xl px-5 py-4">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {online}<span className="text-sm font-medium text-muted">/{visibleDevices.length}</span>
                </p>
                <p className="text-[11px] font-medium tracking-wide uppercase">Node online</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {received == null ? '—' : fmtNum(received, 1)}<span className="text-sm font-medium text-muted">%</span>
                </p>
                <p className="text-[11px] font-medium tracking-wide uppercase">Paket diterima</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-7">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile to="/perangkat" icon={Cpu} label="Total perangkat" value={visibleDevices.length} />
            <StatTile to="/perangkat" icon={Wifi} label="Online" value={online} />
            <StatTile to="/perangkat" icon={WifiOff} label={`Offline > ${settings.offlineMinutes} mnt`} value={offline} />
            <StatTile to="/peringatan" icon={BellRing} label="Peringatan aktif" value={activeAlerts.length} />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-medium">Tren {SENSORS[sensor].label}</h2>
                <p className="mt-1 text-xs text-muted">
                  {range === '7d' ? 'Rata-rata harian' : 'Rata-rata per 30 menit'} dari semua perangkat, dalam {SENSORS[sensor].unit}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={sensor} onChange={(e) => setSensor(e.target.value)} className="w-auto! rounded-full! py-1.5!" aria-label="Pilih sensor">
                  {Object.entries(SENSORS).map(([key, s]) => (
                    <option key={key} value={key}>{s.label}</option>
                  ))}
                </Select>
                <Tabs tabs={[['24h', '24 jam'], ['7d', '7 hari']]} value={range} onChange={setRange} />
              </div>
            </div>
            {range === '7d' ? (
              <DailyBars data={trend} metric={SENSORS[sensor]} zone={zone} height={280} />
            ) : (
              <LineTrend data={trend} metric={SENSORS[sensor]} zone={zone} height={280} />
            )}
          </Card>

          <Card>
            <CardTitle>Nilai Sensor Terkini per Node</CardTitle>
            <Table minWidth={560} head={['Node', ...Object.values(SENSORS).map((s) => `${s.label} (${s.unit})`)]}>
              {visibleDevices.map((d) => {
                const row = latestOf(d.id)
                return (
                  <tr key={d.id}>
                    <Td>
                      <Link to={`/perangkat/${d.id}`} className="font-medium hover:underline">{d.nama}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge status={deviceStatus(d)} />
                        <span className="text-xs whitespace-nowrap text-muted" title={fmtDateTime(row?.recorded_at, zone)}>
                          {relTime(row?.recorded_at)}
                        </span>
                      </div>
                    </Td>
                    {Object.entries(SENSORS).map(([key, s]) => (
                      <Td key={key} className="font-medium tabular-nums">{fmtNum(row?.[key], s.digits)}</Td>
                    ))}
                  </tr>
                )
              })}
            </Table>
            {visibleDevices.length === 0 && <Empty>Belum ada perangkat.</Empty>}
          </Card>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-4 sm:grid-cols-2 xl:col-span-5">
          <Card>
            <CardTitle>Kualitas Link LoRa</CardTitle>
            <Gauge percent={received} label="paket diterima" />
            <ul className="mt-3 space-y-1.5 text-xs">
              {links.map(({ device, row }) => (
                <li key={device.id} className="flex justify-between gap-2">
                  <span className="truncate text-muted">{device.nama}</span>
                  <span className="font-medium tabular-nums">{fmtNum(100 - row.packet_loss, 1)}%</span>
                </li>
              ))}
            </ul>
          </Card>

          <section className="rounded-3xl bg-primary p-5 text-white">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Status Gateway</h2>
              <Link to="/gateway" aria-label="Buka halaman gateway" className="grid size-8 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <p className="text-sm text-white/60">{gateway.nama}</p>
            <p className="mt-1 flex items-center gap-2 text-3xl font-semibold">
              <span className={cx('size-2.5 rounded-full', gateway.status === 'online' ? 'bg-lime' : 'bg-red-400')} />
              {gateway.status === 'online' ? 'Online' : 'Offline'}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                [Server, 'MQTT', gateway.mqtt_status === 'connected' ? 'Terhubung' : 'Terputus'],
                [Globe, 'Internet', gateway.internet_status === 'connected' ? 'Terhubung' : 'Terputus'],
                [Radio, 'Data Terakhir', relTime(gateway.last_seen)],
              ].map(([Icon, label, value]) => (
                <li key={label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-white/60"><Icon size={15} /> {label}</span>
                  <span className="font-medium">{value}</span>
                </li>
              ))}
            </ul>
          </section>

          <Card className="sm:col-span-2">
            <CardTitle action={<Link to="/peringatan" className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas">Lihat semua</Link>}>
              Peringatan Terbaru
            </CardTitle>
            {activeAlerts.length === 0 && <Empty>Tidak ada peringatan aktif.</Empty>}
            <ul className="space-y-3">
              {activeAlerts.slice(0, 3).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-canvas p-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {nameOf(a.device_id)} <StatusBadge status={a.status} />
                    </p>
                    <p className="mt-1 text-xs text-muted">{alertText(a)} · {relTime(a.waktu)}</p>
                  </div>
                  <Button small onClick={() => setAlertStatus(a, a.status === 'baru' ? 'ditangani' : 'selesai')}>
                    {a.status === 'baru' ? 'Tangani' : 'Selesaikan'}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="sm:col-span-2">
            <CardTitle action={<Link to="/perangkat" className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas">Kelola</Link>}>
              Perangkat
            </CardTitle>
            {visibleDevices.length === 0 && <Empty>Belum ada perangkat.</Empty>}
            <ul className="space-y-1">
              {visibleDevices.map((d) => (
                <li key={d.id}>
                  <Link to={`/perangkat/${d.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-canvas">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-semibold">
                      {d.node_id}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{d.nama}</span>
                      <span className="block truncate text-xs text-muted">{d.lokasi} · {relTime(d.last_seen)}</span>
                    </span>
                    <StatusBadge status={deviceStatus(d)} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
