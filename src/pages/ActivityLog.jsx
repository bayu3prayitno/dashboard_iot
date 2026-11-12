import { useState } from 'react'
import { Card, Empty, Input, PageHeader, Table, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'
import { fmtDateTime } from '../lib/format.js'

export default function ActivityLog() {
  const { logs, users, user, isSuper, zone } = useApp()
  const [query, setQuery] = useState('')
  const nameOf = (id) => users.find((u) => u.id === id)?.nama ?? '—'

  const q = query.trim().toLowerCase()
  const list = logs
    .filter((l) => isSuper || l.user_id === user.id)
    .filter((l) => `${l.aksi} ${l.objek} ${l.detail} ${nameOf(l.user_id)}`.toLowerCase().includes(q))
    .sort((a, b) => b.waktu - a.waktu)

  return (
    <>
      <PageHeader
        title="Log Aktivitas"
        subtitle={isSuper ? 'Catatan perubahan penting oleh seluruh pengguna.' : 'Catatan perubahan yang Anda lakukan.'}
      />
      <Card>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari aksi, objek, atau pelaku"
          aria-label="Cari log"
          className="mb-4 sm:max-w-xs"
        />
        <Table minWidth={720} head={['Waktu', 'Pelaku', 'Aksi', 'Objek', 'Detail']}>
          {list.map((l) => (
            <tr key={l.id}>
              <Td className="text-xs whitespace-nowrap text-muted">{fmtDateTime(l.waktu, zone)}</Td>
              <Td className="whitespace-nowrap">{nameOf(l.user_id)}</Td>
              <Td className="font-medium whitespace-nowrap">{l.aksi}</Td>
              <Td>{l.objek}</Td>
              <Td className="text-muted">{l.detail || '—'}</Td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <Empty>Belum ada catatan aktivitas.</Empty>}
      </Card>
    </>
  )
}
