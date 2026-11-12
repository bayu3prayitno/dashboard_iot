import { useState } from 'react'
import ThresholdForm from '../components/ThresholdForm.jsx'
import { Button, Card, CardTitle, Field, Input, PageHeader, Select } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { TIMEZONES } from '../lib/format.js'

export default function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const [form, setForm] = useState({
    timezone: settings.timezone,
    retentionDays: String(settings.retentionDays),
    offlineMinutes: String(settings.offlineMinutes),
    exportFormat: settings.exportFormat,
    exportTime: settings.exportTime,
  })
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const retentionDays = Number(form.retentionDays)
    const offlineMinutes = Number(form.offlineMinutes)
    if (!Number.isInteger(retentionDays) || retentionDays < 1) return setError('Retensi data minimal 1 hari.')
    if (!Number.isInteger(offlineMinutes) || offlineMinutes < 5) return setError('Batas waktu offline minimal 5 menit.')
    setError('')
    updateSettings({ ...form, retentionDays, offlineMinutes })
  }

  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Pengaturan sistem yang berlaku untuk seluruh pengguna." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Sistem</CardTitle>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Zona waktu tampilan" hint="Timestamp disimpan dalam UTC dan ditampilkan sesuai zona ini.">
              <Select value={form.timezone} onChange={set('timezone')}>
                {Object.entries(TIMEZONES).map(([key, z]) => <option key={key} value={key}>{z.label}</option>)}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Retensi data mentah (hari)" hint="Data lebih lama dari ini dihapus.">
                <Input type="number" min="1" value={form.retentionDays} onChange={set('retentionDays')} />
              </Field>
              <Field label="Batas waktu offline (menit)" hint="Usulan: 15 menit (3× interval kirim).">
                <Input type="number" min="5" value={form.offlineMinutes} onChange={set('offlineMinutes')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Format ekspor CSV">
                <Select value={form.exportFormat} onChange={set('exportFormat')}>
                  <option value="comma">Pemisah koma, desimal titik</option>
                  <option value="semicolon">Pemisah titik koma, desimal koma</option>
                </Select>
              </Field>
              <Field label="Waktu pada ekspor">
                <Select value={form.exportTime} onChange={set('exportTime')}>
                  <option value="local">Zona waktu tampilan</option>
                  <option value="utc">UTC</option>
                </Select>
              </Field>
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit">Simpan pengaturan</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Ambang Peringatan Global</CardTitle>
          <p className="-mt-2 mb-4 text-xs text-muted">
            Berlaku untuk semua perangkat, kecuali yang memiliki ambang khusus di halaman Peringatan.
          </p>
          <ThresholdForm scope="global" />
        </Card>
      </div>
    </>
  )
}
