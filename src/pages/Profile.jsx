import { useState } from 'react'
import { Button, Card, CardTitle, Field, Input, PageHeader } from '../components/ui.jsx'
import { useApp } from '../context/store.js'

export default function Profile() {
  const { user, users, updateProfile, changePassword } = useApp()
  const [nama, setNama] = useState(user.nama)
  const [email, setEmail] = useState(user.email)
  const [profileError, setProfileError] = useState('')
  const [pass, setPass] = useState({ lama: '', baru: '', ulang: '' })
  const [passError, setPassError] = useState('')

  const saveProfile = (e) => {
    e.preventDefault()
    const mail = email.trim().toLowerCase()
    if (!nama.trim()) return setProfileError('Nama wajib diisi.')
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setProfileError('Format email tidak valid.')
    if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === mail)) {
      return setProfileError('Email sudah dipakai pengguna lain.')
    }
    setProfileError('')
    updateProfile({ nama: nama.trim(), email: mail })
  }

  const savePassword = (e) => {
    e.preventDefault()
    if (pass.lama !== 'password') return setPassError('Kata sandi saat ini salah.')
    if (pass.baru.length < 8) return setPassError('Kata sandi baru minimal 8 karakter.')
    if (pass.baru !== pass.ulang) return setPassError('Konfirmasi kata sandi tidak sama.')
    setPassError('')
    setPass({ lama: '', baru: '', ulang: '' })
    changePassword()
  }

  const setP = (key) => (e) => setPass((p) => ({ ...p, [key]: e.target.value }))

  return (
    <>
      <PageHeader title="Profil" subtitle={`${user.role} · @${user.username}`} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Data Diri</CardTitle>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Nama"><Input value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Role" hint="Role hanya dapat diubah oleh Super Admin di halaman Pengguna.">
              <Input value={user.role} disabled />
            </Field>
            {profileError && <p className="text-sm text-red-700">{profileError}</p>}
            <Button type="submit">Simpan profil</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Ubah Kata Sandi</CardTitle>
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Kata sandi saat ini">
              <Input type="password" value={pass.lama} onChange={setP('lama')} autoComplete="current-password" />
            </Field>
            <Field label="Kata sandi baru" hint="Minimal 8 karakter.">
              <Input type="password" value={pass.baru} onChange={setP('baru')} autoComplete="new-password" />
            </Field>
            <Field label="Ulangi kata sandi baru">
              <Input type="password" value={pass.ulang} onChange={setP('ulang')} autoComplete="new-password" />
            </Field>
            {passError && <p className="text-sm text-red-700">{passError}</p>}
            <Button type="submit">Perbarui kata sandi</Button>
          </form>
        </Card>
      </div>
    </>
  )
}
