import { useState } from 'react'
import { useApp } from '../context/store.js'
import { Button, Field, Input, Modal, Select } from './ui.jsx'

/** Modal tambah/ubah perangkat. `device` kosong berarti tambah baru. */
export default function DeviceForm({ device, onClose }) {
  const { devices, gateway, addDevice, updateDevice } = useApp()
  const [form, setForm] = useState({
    node_id: device?.node_id ?? '',
    nama: device?.nama ?? '',
    lokasi: device?.lokasi ?? '',
    gateway_id: device?.gateway_id ?? gateway.id,
  })
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const nodeId = Number(form.node_id)
    if (!Number.isInteger(nodeId) || nodeId < 1) return setError('Node ID harus bilangan bulat positif.')
    if (!form.nama.trim() || !form.lokasi.trim()) return setError('Nama dan lokasi wajib diisi.')
    const clash = devices.find(
      (d) => d.node_id === nodeId && d.gateway_id === Number(form.gateway_id) && d.id !== device?.id,
    )
    if (clash) return setError(`Node ID ${nodeId} sudah dipakai oleh ${clash.nama}.`)

    const data = { node_id: nodeId, nama: form.nama.trim(), lokasi: form.lokasi.trim(), gateway_id: Number(form.gateway_id) }
    if (device) updateDevice(device.id, data)
    else addDevice(data)
    onClose()
  }

  return (
    <Modal title={device ? 'Ubah Perangkat' : 'Tambah Perangkat'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Node ID" hint="Harus unik per gateway dan sama dengan ID di program node.">
          <Input type="number" min="1" value={form.node_id} onChange={set('node_id')} autoFocus />
        </Field>
        <Field label="Nama perangkat">
          <Input value={form.nama} onChange={set('nama')} placeholder="mis. Node 4 — Gudang" />
        </Field>
        <Field label="Lokasi">
          <Input value={form.lokasi} onChange={set('lokasi')} placeholder="mis. Gedung C, Lantai 2" />
        </Field>
        <Field label="Gateway">
          <Select value={form.gateway_id} onChange={set('gateway_id')}>
            <option value={gateway.id}>{gateway.nama}</option>
          </Select>
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit">{device ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  )
}
