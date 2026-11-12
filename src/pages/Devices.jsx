import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Pencil, Plus, Power } from 'lucide-react'
import DeviceForm from '../components/DeviceForm.jsx'
import { Button, Card, Empty, Input, PageHeader, StatusBadge, Table, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { fmtDateTime } from '../lib/format.js'

export default function Devices() {
  const { visibleDevices, deviceStatus, gateway, toggleDevice, isSuper, zone } = useApp()
  const location = useLocation()
  // null = tertutup, 'new' = tambah, objek perangkat = ubah
  const [editing, setEditing] = useState(location.state?.add ? 'new' : null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const list = visibleDevices.filter((d) => `${d.nama} ${d.lokasi} ${d.node_id}`.toLowerCase().includes(q))

  return (
    <>
      <PageHeader
        title="Perangkat"
        subtitle={isSuper ? 'Seluruh node sensor yang terdaftar.' : 'Node sensor yang ditugaskan kepada Anda.'}
      >
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} /> Tambah Perangkat
        </Button>
      </PageHeader>

      <Card>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Saring nama, ID, atau lokasi"
          aria-label="Saring perangkat"
          className="mb-4 sm:max-w-xs"
        />
        <Table minWidth={760} head={['Node ID', 'Nama', 'Lokasi', 'Gateway', 'Status', 'Data terakhir', 'Aksi']}>
          {list.map((d) => (
            <tr key={d.id}>
              <Td className="font-semibold tabular-nums">{d.node_id}</Td>
              <Td>
                <Link to={`/perangkat/${d.id}`} className="font-medium hover:text-primary">{d.nama}</Link>
              </Td>
              <Td className="text-muted">{d.lokasi}</Td>
              <Td className="text-muted">{gateway.nama}</Td>
              <Td><StatusBadge status={deviceStatus(d)} /></Td>
              <Td className="text-xs whitespace-nowrap text-muted">{fmtDateTime(d.last_seen, zone)}</Td>
              <Td>
                <div className="flex gap-1.5">
                  <Button small variant="outline" onClick={() => setEditing(d)}>
                    <Pencil size={13} /> Ubah
                  </Button>
                  <Button small variant={d.aktif ? 'danger' : 'outline'} onClick={() => toggleDevice(d)}>
                    <Power size={13} /> {d.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <Empty>Tidak ada perangkat yang cocok.</Empty>}
      </Card>

      {editing && <DeviceForm device={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
