import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, BellRing, Cpu, Download, History, LayoutGrid, LogOut, Menu, Router,
  ScrollText, Search, Settings, Sun, Users,
} from 'lucide-react'
import { useApp } from '../context/store.js'
import { NOW } from '../data/mock.js'
import { exportCsv } from '../lib/data.js'
import { alertText, cx, relTime } from '../lib/format.js'

const PAGE_NAMES = {
  perangkat: 'Perangkat', histori: 'Histori', peringatan: 'Peringatan', gateway: 'Gateway',
  pengguna: 'Pengguna', pengaturan: 'Pengaturan', log: 'Log Aktivitas', profil: 'Profil',
}

const ITEM =
  'group relative flex items-center gap-3 rounded-2xl text-sm transition-colors text-white/60 hover:bg-white/10 hover:text-white'

/** Label melayang untuk ikon pada mode rel (sidebar sempit). */
function Hint({ children }) {
  return (
    <span className="pointer-events-none absolute left-full z-50 ml-3 hidden rounded-lg bg-primary-dark px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg group-hover:block group-focus-visible:block">
      {children}
    </span>
  )
}

function NavItem({ to, icon: Icon, label, badge, expanded, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      aria-label={label}
      className={({ isActive }) =>
        cx(ITEM, expanded ? 'px-3 py-2.5' : 'size-11 justify-center', isActive && 'bg-white/15 text-white')
      }
    >
      <Icon size={19} />
      {expanded ? <span className="flex-1 whitespace-nowrap">{label}</span> : <Hint>{label}</Hint>}
      {badge > 0 && (
        <span
          className={cx(
            'grid h-4.5 min-w-4.5 place-items-center rounded-full bg-lime px-1 text-[10px] font-bold text-ink',
            !expanded && 'absolute -top-0.5 -right-0.5',
          )}
        >
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function ActionItem({ icon: Icon, label, expanded, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cx(ITEM, expanded ? 'w-full px-3 py-2.5' : 'size-11 justify-center')}>
      <Icon size={19} />
      {expanded ? <span className="whitespace-nowrap">{label}</span> : <Hint>{label}</Hint>}
    </button>
  )
}

function Sidebar({ expanded, onNavigate, onToggle }) {
  const { user, isSuper, activeAlerts, logout, visibleDevices, rowsOf, settings, notify } = useApp()
  const initials = user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('')
  const shared = { expanded, onClick: onNavigate }

  const downloadLatest = () => {
    const rows = visibleDevices
      .flatMap((d) => rowsOf(d.id).filter((r) => r.recorded_at >= NOW - 86400000))
      .sort((a, b) => b.recorded_at - a.recorded_at)
    if (!rows.length) return notify('Belum ada data untuk diunduh.')
    exportCsv({ rows, devices: visibleDevices, settings, filename: 'omahiot-24-jam-terakhir.csv' })
  }

  return (
    <div className={cx('flex h-full flex-col gap-1.5 bg-primary py-4 text-white lg:rounded-3xl', expanded ? 'overflow-x-hidden overflow-y-auto px-3' : 'items-center px-2')}>
      {/* Desktop: logo menjadi tombol buka-tutup sidebar. Laci ponsel: logo menuju Dashboard. */}
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'OmahIoT, tutup sidebar' : 'OmahIoT, buka sidebar'}
          className={cx('group relative mb-5 flex items-center gap-3 rounded-2xl text-left', expanded && 'w-full px-1')}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-dark text-lime transition-colors group-hover:bg-black">
            <Sun size={22} />
          </span>
          {expanded ? <span className="text-lg font-semibold whitespace-nowrap">OmahIoT</span> : <Hint>Buka sidebar</Hint>}
        </button>
      ) : (
        <Link to="/" onClick={onNavigate} aria-label="OmahIoT" className={cx('mb-5 flex items-center gap-3', expanded && 'px-1')}>
          <span className="grid size-11 place-items-center rounded-2xl bg-primary-dark text-lime">
            <Sun size={22} />
          </span>
          {expanded && <span className="text-lg font-semibold">OmahIoT</span>}
        </Link>
      )}

      <NavItem to="/" icon={LayoutGrid} label="Dashboard" {...shared} />
      <NavItem to="/perangkat" icon={Cpu} label="Perangkat" {...shared} />
      <NavItem to="/histori" icon={History} label="Histori" {...shared} />
      <NavItem to="/peringatan" icon={BellRing} label="Peringatan" badge={activeAlerts.length} {...shared} />
      <NavItem to="/gateway" icon={Router} label="Gateway" {...shared} />

      <span className={cx('my-2 h-px bg-white/15', expanded ? 'mx-2' : 'w-7')} />

      {isSuper && <NavItem to="/pengguna" icon={Users} label="Pengguna" {...shared} />}
      {isSuper && <NavItem to="/pengaturan" icon={Settings} label="Pengaturan" {...shared} />}
      <NavItem to="/log" icon={ScrollText} label="Log Aktivitas" {...shared} />

      <div className={cx('mt-auto flex flex-col gap-1.5', !expanded && 'items-center')}>
        <ActionItem icon={Download} label="Unduh CSV 24 jam" expanded={expanded} onClick={downloadLatest} />
        <ActionItem icon={LogOut} label="Logout" expanded={expanded} onClick={logout} />
        <Link
          to="/profil"
          onClick={onNavigate}
          aria-label={`Profil ${user.nama}`}
          className={cx('group relative mt-2 flex items-center gap-3 rounded-2xl', expanded && 'px-1')}
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-lime text-sm font-bold text-ink">{initials}</span>
          {expanded ? (
            <span>
              <span className="block text-sm leading-tight font-semibold">{user.nama}</span>
              <span className="block text-xs text-white/60">{user.role}</span>
            </span>
          ) : (
            <Hint>{user.nama} · {user.role}</Hint>
          )}
        </Link>
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
    <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Cari perangkat…"
        aria-label="Cari perangkat (nama, ID, lokasi)"
        className="w-full rounded-full bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm outline-none focus:ring-2 focus:ring-lime"
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
        className="relative grid size-10 place-items-center rounded-full bg-white shadow-sm hover:bg-primary-soft"
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
              <Link key={a.id} to="/peringatan" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-canvas">
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
  const { toast } = useApp()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  // Sidebar desktop: terbuka secara default (ikon + label); klik logo untuk menutup/membuka.
  // Pilihan terakhir diingat per browser.
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem('sidebar') !== 'closed'
    } catch {
      return true
    }
  })
  const toggleSidebar = () => {
    const next = !expanded
    setExpanded(next)
    try {
      localStorage.setItem('sidebar', next ? 'open' : 'closed')
    } catch {
      // penyimpanan tidak tersedia; pilihan hanya berlaku sampai halaman dimuat ulang
    }
  }
  const pageName = PAGE_NAMES[pathname.split('/')[1]] ?? 'Dashboard'

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-3 lg:p-4">
      <aside
        className={cx(
          'sticky top-4 z-30 hidden h-[calc(100vh-2rem)] shrink-0 rounded-3xl bg-primary transition-[width] duration-200 lg:block',
          expanded ? 'w-60' : 'w-[4.5rem]',
        )}
      >
        <Sidebar expanded={expanded} onToggle={toggleSidebar} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside className="h-full w-64" onClick={(e) => e.stopPropagation()}>
            <Sidebar expanded onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Header transparan; di Dashboard ia menumpang di atas banner hero */}
        <header className="relative z-20 flex h-16 items-center gap-3 px-1 sm:px-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm lg:hidden"
          >
            <Menu size={18} />
          </button>
          <p className="hidden items-center gap-2 text-sm text-muted sm:flex">
            <LayoutGrid size={15} /> {pageName}
          </p>
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">
            <DeviceSearch />
            <Notifications />
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary-dark px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
