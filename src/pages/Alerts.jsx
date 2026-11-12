import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Gauge, WifiOff } from 'lucide-react'
import ThresholdForm from '../components/ThresholdForm.jsx'
import { Button, Card, CardTitle, Empty, Field, Input, PageHeader, Select, StatusBadge, Table, Tabs, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { SENSORS, alertText, fmtDateTime } from '../lib/format.js'

function AlertTable({ alerts }) {
  const { devices, users, setAlertStatus, zone } = useApp()
  if (alerts.length === 0) return <Empty>Tidak ada peringatan.</Empty>
  return (
    <Table minWidth={860} head={['Jenis', 'Perangkat', 'Keterangan', 'Waktu kejadian', 'Status', 'Ditangani oleh', 'Aksi']}>
      {alerts.map((a) => {
        const Icon = a.jenis === 'offline' ? WifiOff : Gauge
        return (
          <tr key={a.id}>
            <Td>
              <span className="inline-flex items-center gap-2 font-medium whitespace-nowrap">
                <Icon size={15} className="text-muted" />
                {a.jenis === 'offline' ? 'Offline' : `Ambang ${SENSORS[a.sensor].label}`}
              </span>
            </Td>
            <Td className="whitespace-nowrap">{devices.find((d) => d.id === a.device_id)?.nama ?? '—'}</Td>
            <Td className="text-muted">{alertText(a)}</Td>
            <Td className="text-xs whitespace-nowrap text-muted">{fmtDateTime(a.waktu, zone)}</Td>
            <Td><StatusBadge status={a.status} /></Td>
            <Td className="whitespace-nowrap text-muted">{users.find((u) => u.id === a.ditangani_oleh)?.nama ?? '—'}</Td>
            <Td>
              {a.status === 'baru' && <Button small onClick={() => setAlertStatus(a, 'ditangani')}>Tangani</Button>}
              {a.status === 'ditangani' && <Button small variant="outline" onClick={() => setAlertStatus(a, 'selesai')}>Selesaikan</Button>}
              {a.status === 'selesai' && <span className="text-xs text-muted">—</span>}
            </Td>
          </tr>
        )
      })}
    </Table>
  )
}

function OfflineLimit() {
  const { settings, updateSettings, isSuper } = useApp()
  const [minutes, setMinutes] = useState(String(settings.offlineMinutes))
  const save = (e) => {
    e.preventDefault()
    const value = Number(minutes)
    if (!Number.isInteger(value) || value < 5) return
    updateSettings({ offlineMinutes: value }, `Batas waktu offline: ${value} menit`)
  }
  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <Field
        label="Batas waktu offline (menit)"
        hint={isSuper ? 'Minimal 5 menit. Usulan: 15 menit (3× interval kirim).' : 'Hanya Super Admin yang dapat mengubah nilai ini.'}
      >
        <Input type="number" min="5" step="1" value={minutes} disabled={!isSuper} onChange={(e) => setMinutes(e.target.value)} className="sm:w-48" />
      </Field>
      {isSuper && <Button type="submit" className="mb-5">Simpan</Button>}
    </form>
  )
}

export default function Alerts() {
  const { visibleAlerts, activeAlerts, visibleDevices, isSuper } = useApp()
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab ?? 'aktif')
  const [status, setStatus] = useState('all')
  const [scope, setScope] = useState(location.state?.scope ?? (isSuper ? 'global' : (visibleDevices[0]?.id ?? 'global')))

  const history = status === 'all' ? visibleAlerts : visibleAlerts.filter((a) => a.status === status)
  const scopeValue = scope === 'global' ? 'global' : Number(scope)

  return (
    <>
      <PageHeader title="Peringatan" subtitle="Perangkat offline dan nilai sensor yang melewati ambang batas." />

      <div className="mb-4">
        <Tabs
          tabs={[['aktif', `Aktif (${activeAlerts.length})`], ['riwayat', 'Riwayat'], ['ambang', 'Pengaturan ambang']]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'aktif' && (
        <Card>
          <CardTitle>Peringatan Aktif</CardTitle>
          <AlertTable alerts={activeAlerts} />
        </Card>
      )}

      {tab === 'riwayat' && (
        <Card>
          <CardTitle
            action={
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto! py-1.5!" aria-label="Saring status">
                <option value="all">Semua status</option>
                <option value="baru">Baru</option>
                <option value="ditangani">Ditangani</option>
                <option value="selesai">Selesai</option>
              </Select>
            }
          >
            Riwayat Peringatan
          </CardTitle>
          <AlertTable alerts={history} />
        </Card>
      )}

      {tab === 'ambang' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardTitle
              action={
                <Select value={scope} onChange={(e) => setScope(e.target.value)} className="w-auto! py-1.5!" aria-label="Cakupan ambang">
                  <option value="global">Global (semua perangkat)</option>
                  {visibleDevices.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </Select>
              }
            >
              Ambang per Sensor
            </CardTitle>
            {scopeValue === 'global' && !isSuper && (
              <p className="mb-3 text-xs text-muted">Ambang global hanya dapat diubah oleh Super Admin. Pilih perangkat untuk mengatur ambang khusus.</p>
            )}
            <ThresholdForm key={scopeValue} scope={scopeValue} readOnly={scopeValue === 'global' && !isSuper} />
          </Card>
          <Card>
            <CardTitle>Perangkat Offline</CardTitle>
            <OfflineLimit />
          </Card>
        </div>
      )}
    </>
  )
}
