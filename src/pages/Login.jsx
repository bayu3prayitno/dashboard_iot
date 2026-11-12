import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { Button, Field, Input } from '../components/ui.jsx'
import { useApp } from '../context/store.js'

const DEMO = [
  ['Super Admin', 'superadmin@omahiot.example'],
  ['Admin', 'admin@omahiot.example'],
]

export default function Login() {
  const { user, login } = useApp()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const submit = (e) => {
    e.preventDefault()
    setError(login(identifier, password) ?? '')
  }

  return (
    <div className="grid min-h-screen p-3 lg:grid-cols-2 lg:p-4">
      <div className="hidden flex-col justify-between rounded-3xl bg-primary-dark p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary">
            <Radio size={18} />
          </span>
          <span className="text-lg font-semibold">OmahIoT</span>
        </div>
        <div>
          <p className="max-w-md text-4xl leading-tight font-semibold">
            Pantau node sensor dan gateway LoRa dari satu tempat.
          </p>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Suhu, tegangan, arus, daya, dan irradiance tiap 5 menit, lengkap dengan histori, peringatan, dan kualitas link.
          </p>
        </div>
        <p className="text-xs text-white/50">Dashboard Monitoring IoT</p>
      </div>

      <div className="flex items-center justify-center p-4">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-7">
          <div>
            <h1 className="text-2xl font-semibold">Masuk</h1>
            <p className="mt-1 text-sm text-muted">Gunakan email atau username Anda.</p>
          </div>
          <Field label="Email / username">
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" autoFocus />
          </Field>
          <Field label="Kata sandi">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button type="submit" className="w-full">Masuk</Button>

          <div className="rounded-2xl bg-canvas p-3 text-xs text-muted">
            <p className="font-medium text-ink">Akun demo (kata sandi: password)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO.map(([role, email]) => (
                <Button
                  key={role}
                  small
                  variant="outline"
                  onClick={() => {
                    setIdentifier(email)
                    setPassword('password')
                  }}
                >
                  Isi sebagai {role}
                </Button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
