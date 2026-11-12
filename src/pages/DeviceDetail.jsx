import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil } from 'lucide-react'
import { LineTrend } from '../components/charts.jsx'
import DeviceForm from '../components/DeviceForm.jsx'
import { Button, Card, CardTitle, Empty, Select, StatusBadge, Tabs } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { NOW } from '../data/mock.js'
import { bucketSeries } from '../lib/data.js'
import { ALL_METRICS, LINK_METRICS, SENSORS, fmtDateTime, fmtNum, relTime } from '../lib/format.js'

function Tile({ label, value, unit, note }) {
  return (
    <div className="rounded-3xl bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums">
        {value} {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  )
}

export default function DeviceDetail() {
  const { id } = useParams()
  const { visibleDevices, deviceStatus, rowsOf, latestOf, effectiveThreshold, gateway, zone } = useApp()
  const [metric, setMetric] = useState('power')
  const [range, setRange] = useState('24h')
  const [editing, setEditing] = useState(false)

  const device = visibleDevices.find((d) => d.id === Number(id))
  const rows = rowsOf(Number(id))
  const series = useMemo(
    () => bucketSeries(rows, metric, NOW - (range === '24h' ? 1 : 7) * 86400000, NOW),
    [rows, metric, range],
  )

  if (!device) {
    return (
      <Card>
        <Empty>Perangkat tidak ditemukan atau tidak termasuk perangkat yang Anda kelola.</Empty>
        <div className="text-center">
          <Link to="/perangkat" className="text-sm font-medium text-primary">Kembali ke daftar perangkat</Link>
        </div>
      </Card>
    )
  }

  const row = latestOf(device.id)

  return (
    <>
      <Link to="/perangkat" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft size={16} /> Perangkat
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">{device.nama}</h1>
            <StatusBadge status={deviceStatus(device)} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Node ID {device.node_id} · {device.lokasi} · {gateway.nama}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil size={15} /> Ubah
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Object.entries(SENSORS).map(([key, s]) => (
          <Tile key={key} label={s.label} value={fmtNum(row?.[key], s.digits)} unit={s.unit} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            action={
              <Select value={metric} onChange={(e) => setMetric(e.target.value)} className="w-auto! py-1.5!" aria-label="Pilih parameter">
                <optgroup label="Sensor">
                  {Object.entries(SENSORS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                </optgroup>
                <optgroup label="Link LoRa">
                  {Object.entries(LINK_METRICS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                </optgroup>
              </Select>
            }
          >
            Grafik {ALL_METRICS[metric].label} ({ALL_METRICS[metric].unit})
          </CardTitle>
          <div className="mb-3">
            <Tabs tabs={[['24h', '24 jam'], ['7d', '7 hari']]} value={range} onChange={setRange} />
          </div>
          <LineTrend data={series} metric={ALL_METRICS[metric]} zone={zone} height={280} />
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardTitle>Kualitas Link</CardTitle>
            <dl className="space-y-3 text-sm">
              {[
                ['RSSI', row ? `${row.rssi} dBm` : '—'],
                ['SNR', row ? `${fmtNum(row.snr, 1)} dB` : '—'],
                ['Packet loss (perkiraan)', row ? `${fmtNum(row.packet_loss, 1)} %` : '—'],
                ['Nomor paket terakhir', row ? row.packet_no : '—'],
                ['Waktu pembaruan', fmtDateTime(row?.recorded_at, zone)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted">Data terakhir diterima {relTime(device.last_seen)}.</p>
          </Card>

          <Card>
            <CardTitle action={<Link to="/peringatan" state={{ tab: 'ambang', scope: device.id }} className="text-xs font-medium text-primary">Atur</Link>}>
              Ambang Berlaku
            </CardTitle>
            <dl className="space-y-2 text-sm">
              {Object.entries(SENSORS).map(([key, s]) => {
                const t = effectiveThreshold(device.id, key)
                return (
                  <div key={key} className="flex justify-between gap-3">
                    <dt className="text-muted">{s.label}</dt>
                    <dd className="font-medium tabular-nums">
                      {fmtNum(t.min, s.digits)} – {fmtNum(t.max, s.digits)} {s.unit}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </Card>
        </div>
      </div>

      {editing && <DeviceForm device={device} onClose={() => setEditing(false)} />}
    </>
  )
}
