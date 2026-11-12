import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell, BellRing, Cpu, Download, History, LayoutDashboard, LogOut, Menu, Radio, Router,
  ScrollText, Search, Settings, Users, X,
} from 'lucide-react'
import { useApp } from '../context/store.js'
import { NOW } from '../data/mock.js'
import { exportCsv } from '../lib/data.js'
import { alertText, cx, relTime } from '../lib/format.js'

function NavItem({ to, icon: Icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive ? 'bg-primary-soft font-semibold text-primary' : 'text-muted hover:bg-canvas hover:text-ink',
        )
      }
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">{badge}</span>
      )}
    </NavLink>
  )
}

function Sidebar({ onNavigate }) {
  const { isSuper, activeAlerts, logout, visibleDevices, rowsOf, settings, notify } = useApp()

  const downloadLatest = () => {
    const rows = visibleDevices
      .flatMap((d) => rowsOf(d.id).filter((r) => r.recorded_at >= NOW - 86400000))
      .sort((a, b) => b.recorded_at - a.recorded_at)
    if (!rows.length) return notify('Belum ada data untuk diunduh.')
    exportCsv({ rows, devices: visibleDevices, settings, filename: 'omahiot-24-jam-terakhir.csv' })
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-1">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-white">
          <Radio size={18} />
        </span>
        <span className="text-lg font-semibold">OmahIoT</span>
      </Link>

      <nav className="space-y-1">
        <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-muted">MENU</p>
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} />
        <NavItem to="/perangkat" icon={Cpu} label="Perangkat" onClick={onNavigate} />
        <NavItem to="/histori" icon={History} label="Histori" onClick={onNavigate} />
        <NavItem to="/peringatan" icon={BellRing} label="Peringatan" badge={activeAlerts.length} onClick={onNavigate} />
        <NavItem to="/gateway" icon={Router} label="Gateway" onClick={onNavigate} />
      </nav>

      <nav className="space-y-1">
        <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-muted">GENERAL</p>
        {isSuper && <NavItem to="/pengguna" icon={Users} label="Pengguna" onClick={onNavigate} />}
        {isSuper && <NavItem to="/pengaturan" icon={Settings} label="Pengaturan" onClick={onNavigate} />}
        <NavItem to="/log" icon={ScrollText} label="Log Aktivitas" onClick={onNavigate} />
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-canvas hover:text-ink"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      <div className="mt-auto rounded-2xl bg-primary-dark p-4 text-white">
        <p className="text-sm font-semibold">Unduh CSV terbaru</p>
        <p className="mt-1 text-xs text-white/70">Data 24 jam terakhir dari perangkat yang Anda kelola.</p>
        <button
          type="button"
          onClick={downloadLatest}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-medium hover:bg-primary-light hover:text-primary-dark"
        >
          <Download size={14} />
          Unduh
        </button>
      </div>
    </div>
  )
}

function DeviceSearch() {
  const { visibleDevices } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const q = query.trim().toLowerCase()
  const results = q
    ? visibleDevices.filter((d) => `${d.nama} ${d.lokasi} node ${d.node_id}`.toLowerCase().includes(q))
    : []

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Cari perangkat (nama, ID, lokasi)"
        aria-label="Cari perangkat"
        className="w-full rounded-full bg-canvas py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
      />
      {open && q && (
        <div className="absolute top-full right-0 left-0 z-30 mt-2 rounded-2xl border border-line bg-white p-2 shadow-lg">
          {results.length === 0 && <p className="px-3 py-2 text-sm text-muted">Perangkat tidak ditemukan.</p>}
          {results.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={() => {
                navigate(`/perangkat/${d.id}`)
                setQuery('')
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
            >
              <span className="font-medium">{d.nama}</span>
              <span className="block text-xs text-muted">Node ID {d.node_id} · {d.lokasi}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const { visibleAlerts, devices } = useApp()
  const [open, setOpen] = useState(false)
  const fresh = visibleAlerts.filter((a) => a.status === 'baru')

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifikasi, ${fresh.length} peringatan baru`}
        className="relative grid size-10 place-items-center rounded-full bg-canvas hover:bg-primary-soft"
      >
        <Bell size={18} />
        {fresh.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid size-4.5 place-items-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
            {fresh.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-2 shadow-lg">
            <p className="px-3 py-2 text-sm font-semibold">Peringatan baru</p>
            {fresh.length === 0 && <p className="px-3 pb-3 text-sm text-muted">Tidak ada peringatan baru.</p>}
            {fresh.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                to="/peringatan"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 hover:bg-canvas"
              >
                <span className="block text-sm font-medium">{devices.find((d) => d.id === a.device_id)?.nama}</span>
                <span className="block text-xs text-muted">{alertText(a)} · {relTime(a.waktu)}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, toast } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-3 lg:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 rounded-3xl bg-white lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside className="h-full w-64 bg-white" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
          <button type="button" aria-label="Tutup menu" className="absolute top-4 left-[17rem] rounded-full bg-white p-2">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="mb-4 flex items-center gap-3 rounded-3xl bg-white p-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas lg:hidden"
          >
            <Menu size={18} />
          </button>
          <DeviceSearch />
          <div className="ml-auto flex items-center gap-3">
            <Notifications />
            <Link to="/profil" className="flex items-center gap-2.5 rounded-full py-1 pr-1 hover:bg-canvas sm:pr-4">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm leading-tight font-semibold">{user.nama}</span>
                <span className="block text-xs text-muted">{user.role}</span>
              </span>
            </Link>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
