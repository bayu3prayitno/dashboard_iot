import { useMemo, useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { LineTrend } from '../components/charts.jsx'
import { Button, Card, CardTitle, Empty, Field, Input, PageHeader, Select, Table, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { NOW } from '../data/mock.js'
import { bucketSeries, exportCsv } from '../lib/data.js'
import { SENSORS, dayStart, dayString, fmtDateTime, fmtNum } from '../lib/format.js'

const PAGE_SIZE = 25
const DAY = 86400000

export default function HistoryPage() {
  const { visibleDevices, rowsOf, settings, zone, notify } = useApp()
  const today = dayString(NOW, zone)
  const [deviceId, setDeviceId] = useState('all')
  const [sensor, setSensor] = useState('all')
  const [from, setFrom] = useState(dayString(NOW - DAY, zone))
  const [to, setTo] = useState(today)
  const [page, setPage] = useState(1)

  const change = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }
  const quick = (days) => {
    setFrom(dayString(NOW - (days - 1) * DAY, zone))
    setTo(today)
    setPage(1)
  }

  const fromTs = dayStart(from || today, zone)
  const toTs = dayStart(to || today, zone) + DAY
  const invalid = fromTs >= toTs

  const selected = deviceId === 'all' ? visibleDevices : visibleDevices.filter((d) => d.id === Number(deviceId))
  const selectedKey = selected.map((d) => d.id).join()
  const rows = useMemo(
    () =>
      selected
        .flatMap((d) => rowsOf(d.id).filter((r) => r.recorded_at >= fromTs && r.recorded_at < toTs))
        .sort((a, b) => b.recorded_at - a.recorded_at),
    // rowsOf membaca data tiruan statis; id perangkat terpilih cukup sebagai dependensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKey, fromTs, toTs],
  )

  const chartSensor = sensor === 'all' ? 'power' : sensor
  const series = useMemo(
    () => bucketSeries(rows, chartSensor, fromTs, Math.min(toTs, NOW)),
    [rows, chartSensor, fromTs, toTs],
  )

  const sensors = sensor === 'all' ? Object.keys(SENSORS) : [sensor]
  const nameOf = (id) => visibleDevices.find((d) => d.id === id)?.nama ?? '—'
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const gaps = rows.reduce((sum, r) => sum + r.gap, 0)

  const download = () => {
    if (!rows.length) return notify('Tidak ada data pada filter ini.')
    exportCsv({ rows, devices: visibleDevices, settings, sensors, filename: `omahiot-histori-${from}_${to}.csv` })
  }

  return (
    <>
      <PageHeader title="Histori" subtitle="Data pengukuran tersimpan, lengkap dengan nomor paket untuk melacak data hilang.">
        <Button onClick={download}>
          <Download size={16} /> Ekspor CSV
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Perangkat">
            <Select value={deviceId} onChange={change(setDeviceId)}>
              <option value="all">Semua perangkat</option>
              {visibleDevices.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </Select>
          </Field>
          <Field label="Jenis sensor">
            <Select value={sensor} onChange={change(setSensor)}>
              <option value="all">Semua sensor</option>
              {Object.entries(SENSORS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Dari tanggal">
            <Input type="date" value={from} max={today} onChange={change(setFrom)} />
          </Field>
          <Field label="Sampai tanggal">
            <Input type="date" value={to} max={today} onChange={change(setTo)} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Rentang cepat:</span>
          <Button small variant="outline" onClick={() => quick(1)}>Hari ini</Button>
          <Button small variant="outline" onClick={() => quick(3)}>3 hari</Button>
          <Button small variant="outline" onClick={() => quick(7)}>7 hari</Button>
          {invalid && <span className="text-sm text-red-700">Tanggal awal harus sebelum tanggal akhir.</span>}
        </div>
      </Card>

      <Card className="mb-4">
        <CardTitle>
          Grafik {SENSORS[chartSensor].label} ({SENSORS[chartSensor].unit})
        </CardTitle>
        <p className="-mt-2 mb-3 text-xs text-muted">
          {deviceId === 'all' ? 'Rata-rata semua perangkat' : nameOf(Number(deviceId))}
          {sensor === 'all' && ' · pilih jenis sensor untuk mengganti grafik'}
          {' · garis terputus menandakan tidak ada data'}
        </p>
        <LineTrend data={series} metric={SENSORS[chartSensor]} zone={zone} height={260} />
      </Card>

      <Card>
        <CardTitle
          action={
            gaps > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <AlertTriangle size={13} /> {gaps} paket hilang terdeteksi
              </span>
            )
          }
        >
          Tabel Pengukuran <span className="text-sm font-normal text-muted">({rows.length.toLocaleString('id-ID')} baris)</span>
        </CardTitle>
        <Table
          minWidth={sensor === 'all' ? 980 : 720}
          head={['Waktu', 'Perangkat', 'No. paket', ...sensors.map((s) => `${SENSORS[s].label} (${SENSORS[s].unit})`), 'RSSI', 'SNR', 'Loss']}
        >
          {visible.map((r) => (
            <tr key={r.id}>
              <Td className="text-xs whitespace-nowrap">{fmtDateTime(r.recorded_at, zone)}</Td>
              <Td className="whitespace-nowrap">{nameOf(r.device_id)}</Td>
              <Td className="whitespace-nowrap tabular-nums">
                {r.packet_no}
                {r.gap > 0 && (
                  <span title="Nomor paket meloncat dari baris sebelumnya" className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    <AlertTriangle size={11} /> {r.gap} hilang
                  </span>
                )}
              </Td>
              {sensors.map((s) => (
                <Td key={s} className="tabular-nums">{fmtNum(r[s], SENSORS[s].digits)}</Td>
              ))}
              <Td className="tabular-nums text-muted">{r.rssi}</Td>
              <Td className="tabular-nums text-muted">{fmtNum(r.snr, 1)}</Td>
              <Td className="tabular-nums text-muted">{fmtNum(r.packet_loss, 1)}%</Td>
            </tr>
          ))}
        </Table>
        {rows.length === 0 && <Empty>Tidak ada data pada filter ini.</Empty>}
        {rows.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">Halaman {current} dari {pages}</span>
            <div className="flex gap-2">
              <Button small variant="outline" disabled={current <= 1} onClick={() => setPage(current - 1)}>Sebelumnya</Button>
              <Button small variant="outline" disabled={current >= pages} onClick={() => setPage(current + 1)}>Berikutnya</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
