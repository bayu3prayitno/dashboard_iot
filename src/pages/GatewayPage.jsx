import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Eye, Globe, Pencil, Router, Server } from 'lucide-react'
import { Button, Card, CardTitle, Field, Input, Modal, PageHeader, StatusBadge, Table, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { fmtDateTime, fmtNum, relTime } from '../lib/format.js'

function GatewayForm({ onClose }) {
  const { gateway, updateGateway } = useApp()
  const [nama, setNama] = useState(gateway.nama)
  const [lokasi, setLokasi] = useState(gateway.lokasi)
  const submit = (e) => {
    e.preventDefault()
    if (!nama.trim() || !lokasi.trim()) return
    updateGateway({ nama: nama.trim(), lokasi: lokasi.trim() })
    onClose()
  }
  return (
    <Modal title="Ubah Gateway" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama gateway"><Input value={nama} onChange={(e) => setNama(e.target.value)} autoFocus /></Field>
        <Field label="Lokasi"><Input value={lokasi} onChange={(e) => setLokasi(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Modal>
  )
}

function StatusTile({ icon: Icon, label, children, note }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon size={16} /> {label}
      </div>
      <div className="mt-3">{children}</div>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </Card>
  )
}

export default function GatewayPage() {
  const { gateway, isSuper, visibleDevices, deviceStatus, latestOf, zone } = useApp()
  const [editing, setEditing] = useState(false)

  return (
    <>
      <PageHeader title="Gateway" subtitle="Status penerima LoRa, koneksi MQTT, dan internet.">
        {isSuper ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Ubah identitas
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs text-muted">
            <Eye size={14} /> Hanya lihat
          </span>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusTile icon={Router} label="Gateway" note={gateway.nama}>
          <StatusBadge status={gateway.status} />
        </StatusTile>
        <StatusTile icon={Server} label="MQTT" note={gateway.broker}>
          <StatusBadge status={gateway.mqtt_status} />
        </StatusTile>
        <StatusTile icon={Globe} label="Internet" note="Koneksi gateway ke jaringan luar">
          <StatusBadge status={gateway.internet_status} />
        </StatusTile>
        <StatusTile icon={Clock} label="Komunikasi terakhir" note={fmtDateTime(gateway.last_seen, zone)}>
          <p className="text-xl font-semibold">{relTime(gateway.last_seen)}</p>
        </StatusTile>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardTitle>Identitas</CardTitle>
          <dl className="space-y-3 text-sm">
            {[
              ['Nama', gateway.nama],
              ['Lokasi', gateway.lokasi],
              ['Interval beacon', `${gateway.beacon_menit} menit`],
              ['Topic MQTT', gateway.topic],
              ['Halaman web lokal', `http://${gateway.ip_lokal}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="text-right font-medium break-all">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-2xl bg-canvas p-3 text-xs text-muted">
            Gateway juga menyimpan data ke CSV di kartu SD. Jika koneksi ke website terputus, data dapat
            diunduh dari halaman web lokal gateway di jaringan yang sama.
          </p>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle>Node Terhubung</CardTitle>
          <Table minWidth={560} head={['Node', 'Status', 'RSSI', 'SNR', 'Packet loss', 'Paket terakhir']}>
            {visibleDevices.map((d) => {
              const row = latestOf(d.id)
              return (
                <tr key={d.id}>
                  <Td><Link to={`/perangkat/${d.id}`} className="font-medium hover:text-primary">{d.nama}</Link></Td>
                  <Td><StatusBadge status={deviceStatus(d)} /></Td>
                  <Td className="tabular-nums">{row ? `${row.rssi} dBm` : '—'}</Td>
                  <Td className="tabular-nums">{row ? `${fmtNum(row.snr, 1)} dB` : '—'}</Td>
                  <Td className="tabular-nums">{row ? `${fmtNum(row.packet_loss, 1)} %` : '—'}</Td>
                  <Td className="text-xs whitespace-nowrap text-muted">{relTime(d.last_seen)}</Td>
                </tr>
              )
            })}
          </Table>
        </Card>
      </div>

      {editing && <GatewayForm onClose={() => setEditing(false)} />}
    </>
  )
}
