import { useState } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import { Button, Card, Field, Input, Modal, PageHeader, Select, StatusBadge, Table, Td } from '../components/ui.jsx'
import { useApp } from '../context/store.js'

function UserForm({ target, onClose }) {
  const { users, devices, addUser, updateUser } = useApp()
  const [form, setForm] = useState({
    nama: target?.nama ?? '',
    email: target?.email ?? '',
    username: target?.username ?? '',
    role: target?.role ?? 'Admin',
    deviceIds: target?.deviceIds ?? [],
    password: '',
  })
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleDevice = (id) =>
    setForm((f) => ({
      ...f,
      deviceIds: f.deviceIds.includes(id) ? f.deviceIds.filter((x) => x !== id) : [...f.deviceIds, id],
    }))

  const submit = (e) => {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    const username = form.username.trim().toLowerCase()
    if (!form.nama.trim() || !email || !username) return setError('Nama, email, dan username wajib diisi.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Format email tidak valid.')
    if (users.some((u) => u.id !== target?.id && (u.email.toLowerCase() === email || u.username.toLowerCase() === username))) {
      return setError('Email atau username sudah dipakai pengguna lain.')
    }
    if (!target && form.password.length < 8) return setError('Kata sandi minimal 8 karakter.')

    const data = {
      nama: form.nama.trim(), email, username, role: form.role,
      deviceIds: form.role === 'Admin' ? form.deviceIds : [],
    }
    if (target) updateUser(target.id, data)
    else addUser({ ...data, aktif: true })
    onClose()
  }

  return (
    <Modal title={target ? 'Ubah Pengguna' : 'Tambah Pengguna'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama"><Input value={form.nama} onChange={set('nama')} autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Username"><Input value={form.username} onChange={set('username')} /></Field>
        </div>
        {!target && (
          <Field label="Kata sandi awal" hint="Minimal 8 karakter.">
            <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
        )}
        <Field label="Role">
          <Select value={form.role} onChange={set('role')}>
            <option>Admin</option>
            <option>Super Admin</option>
          </Select>
        </Field>
        {form.role === 'Admin' ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Perangkat yang dikelola</legend>
            <div className="space-y-1 rounded-xl border border-line p-2">
              {devices.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-canvas">
                  <input type="checkbox" className="size-4 accent-primary" checked={form.deviceIds.includes(d.id)} onChange={() => toggleDevice(d.id)} />
                  <span>{d.nama} <span className="text-muted">· {d.lokasi}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-xl bg-canvas p-3 text-xs text-muted">Super Admin memiliki akses ke seluruh perangkat dan pengaturan.</p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit">{target ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function UsersPage() {
  const { users, user, devices, toggleUser } = useApp()
  const [editing, setEditing] = useState(null)

  const assigned = (u) =>
    u.role === 'Super Admin'
      ? 'Semua perangkat'
      : devices.filter((d) => u.deviceIds.includes(d.id)).map((d) => `Node ${d.node_id}`).join(', ') || 'Belum ada'

  return (
    <>
      <PageHeader title="Pengguna" subtitle="Kelola akun, role, dan penugasan perangkat.">
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} /> Tambah Pengguna
        </Button>
      </PageHeader>

      <Card>
        <Table minWidth={760} head={['Nama', 'Email', 'Role', 'Perangkat dikelola', 'Status', 'Aksi']}>
          {users.map((u) => (
            <tr key={u.id}>
              <Td>
                <span className="font-medium">{u.nama}</span>
                {u.id === user.id && <span className="ml-2 text-xs text-muted">(Anda)</span>}
                <span className="block text-xs text-muted">@{u.username}</span>
              </Td>
              <Td className="text-muted">{u.email}</Td>
              <Td className="whitespace-nowrap">{u.role}</Td>
              <Td className="text-muted">{assigned(u)}</Td>
              <Td><StatusBadge status={u.aktif ? 'aktif' : 'nonaktif'} /></Td>
              <Td>
                <div className="flex gap-1.5">
                  <Button small variant="outline" onClick={() => setEditing(u)}>
                    <Pencil size={13} /> Ubah
                  </Button>
                  <Button
                    small
                    variant={u.aktif ? 'danger' : 'outline'}
                    disabled={u.id === user.id}
                    title={u.id === user.id ? 'Anda tidak dapat menonaktifkan akun sendiri' : undefined}
                    onClick={() => toggleUser(u)}
                  >
                    <Power size={13} /> {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      {editing && <UserForm target={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
