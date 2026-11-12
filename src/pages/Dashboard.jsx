import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Download, Globe, Plus, Radio, Server } from 'lucide-react'
import { DailyBars, Gauge, LineTrend } from '../components/charts.jsx'
import { Button, Card, CardTitle, Empty, PageHeader, Select, StatusBadge, Table, Tabs, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { NOW } from '../data/mock.js'
import { bucketSeries, dailySeries, exportCsv } from '../lib/data.js'
import { SENSORS, alertText, cx, fmtDateTime, fmtNum, relTime } from '../lib/format.js'

function StatCard({ label, value, note, highlight, to }) {
  return (
    <Link
      to={to}
      className={cx(
        'block rounded-3xl p-5 transition-shadow hover:shadow-md',
        highlight ? 'bg-gradient-to-br from-primary to-primary-dark text-white' : 'bg-white',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className={cx('grid size-8 place-items-center rounded-full border', highlight ? 'border-white/40' : 'border-line')}>
          <ArrowUpRight size={16} />
        </span>
      </div>
      <p className="mt-3 text-5xl font-semibold">{value}</p>
      <p className={cx('mt-2 text-xs', highlight ? 'text-white/70' : 'text-muted')}>{note}</p>
    </Link>
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

  const allRows = useMemo(
    () => visibleDevices.flatMap((d) => rowsOf(d.id)),
    // rowsOf membaca data tiruan statis; daftar perangkat cukup sebagai dependensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleDevices.map((d) => d.id).join()],
  )
  const trend = useMemo(
    () =>
      range === '7d'
        ? dailySeries(allRows, sensor, 7, zone)
        : bucketSeries(allRows, sensor, NOW - 86400000, NOW, 48),
    [allRows, sensor, range, zone],
  )

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
      <PageHeader title="Dashboard" subtitle="Pantau node sensor dan gateway secara real-time.">
        <Button onClick={() => navigate('/perangkat', { state: { add: true } })}>
          <Plus size={16} /> Tambah Perangkat
        </Button>
        <Button variant="outline" onClick={exportToday}>
          <Download size={16} /> Ekspor CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard highlight to="/perangkat" label="Total Perangkat" value={visibleDevices.length} note="Node sensor yang Anda kelola" />
        <StatCard to="/perangkat" label="Online" value={online} note="Mengirim data sesuai jadwal" />
        <StatCard to="/perangkat" label="Offline" value={offline} note={`Tanpa data > ${settings.offlineMinutes} menit`} />
        <StatCard to="/peringatan" label="Peringatan Aktif" value={activeAlerts.length} note="Baru dan sedang ditangani" />

        <Card className="sm:col-span-2">
          <CardTitle
            action={
              <Select value={sensor} onChange={(e) => setSensor(e.target.value)} className="w-auto! py-1.5!" aria-label="Pilih sensor">
                {Object.entries(SENSORS).map(([key, s]) => (
                  <option key={key} value={key}>{s.label}</option>
                ))}
              </Select>
            }
          >
            Tren {SENSORS[sensor].label} ({SENSORS[sensor].unit})
          </CardTitle>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Tabs tabs={[['24h', '24 jam'], ['7d', '7 hari']]} value={range} onChange={setRange} />
            <p className="text-xs text-muted">
              {range === '7d' ? 'Rata-rata harian' : 'Rata-rata per 30 menit'}, semua perangkat
            </p>
          </div>
          {range === '7d' ? (
            <DailyBars data={trend} metric={SENSORS[sensor]} zone={zone} height={300} />
          ) : (
            <LineTrend data={trend} metric={SENSORS[sensor]} zone={zone} height={300} />
          )}
        </Card>

        <Card>
          <CardTitle action={<Link to="/peringatan" className="text-xs font-medium text-primary">Lihat semua</Link>}>
            Peringatan Terbaru
          </CardTitle>
          {activeAlerts.length === 0 && <Empty>Tidak ada peringatan aktif.</Empty>}
          <ul className="space-y-3">
            {activeAlerts.slice(0, 3).map((a) => (
              <li key={a.id} className="rounded-2xl bg-canvas p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{nameOf(a.device_id)}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-xs text-muted">{alertText(a)}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{relTime(a.waktu)}</span>
                  <Button small onClick={() => setAlertStatus(a, a.status === 'baru' ? 'ditangani' : 'selesai')}>
                    {a.status === 'baru' ? 'Tangani' : 'Selesaikan'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle action={<Link to="/perangkat" className="text-xs font-medium text-primary">Kelola</Link>}>
            Perangkat
          </CardTitle>
          {visibleDevices.length === 0 && <Empty>Belum ada perangkat.</Empty>}
          <ul className="space-y-1">
            {visibleDevices.map((d) => (
              <li key={d.id}>
                <Link to={`/perangkat/${d.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-canvas">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-semibold text-primary">
                    {d.node_id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{d.nama}</span>
                    <span className="block truncate text-xs text-muted">{relTime(d.last_seen)}</span>
                  </span>
                  <StatusBadge status={deviceStatus(d)} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="sm:col-span-2">
          <CardTitle>Nilai Sensor Terkini per Node</CardTitle>
          <Table minWidth={560} head={['Node', ...Object.values(SENSORS).map((s) => `${s.label} (${s.unit})`)]}>
            {visibleDevices.map((d) => {
              const row = latestOf(d.id)
              return (
                <tr key={d.id}>
                  <Td>
                    <Link to={`/perangkat/${d.id}`} className="font-medium hover:text-primary">{d.nama}</Link>
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

        <section className="rounded-3xl bg-primary-dark p-5 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Status Gateway</h2>
            <Link to="/gateway" aria-label="Buka halaman gateway" className="grid size-8 place-items-center rounded-full border border-white/30 hover:bg-white/10">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-sm text-white/70">{gateway.nama}</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-semibold">
            <span className={cx('size-2.5 rounded-full', gateway.status === 'online' ? 'bg-primary-light' : 'bg-red-400')} />
            {gateway.status === 'online' ? 'Online' : 'Offline'}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              [Server, 'MQTT', gateway.mqtt_status === 'connected' ? 'Terhubung' : 'Terputus'],
              [Globe, 'Internet', gateway.internet_status === 'connected' ? 'Terhubung' : 'Terputus'],
              [Radio, 'Terakhir komunikasi', relTime(gateway.last_seen)],
            ].map(([Icon, label, value]) => (
              <li key={label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-white/70"><Icon size={15} /> {label}</span>
                <span className="font-medium">{value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
