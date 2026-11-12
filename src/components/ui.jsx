import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cx } from '../lib/format.js'

export function Card({ className, children }) {
  return <section className={cx('min-w-0 rounded-3xl bg-white p-5', className)}>{children}</section>
}

export function CardTitle({ children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  )
}

const BUTTON = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  outline: 'border border-primary/25 text-ink hover:bg-primary-soft',
  ghost: 'text-muted hover:bg-canvas hover:text-ink',
  danger: 'border border-red-200 text-red-700 hover:bg-red-50',
}

export function Button({ variant = 'primary', small, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors disabled:opacity-50',
        small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        BUTTON[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

const STATUS = {
  online: ['Online', 'bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
  offline: ['Offline', 'bg-red-50 text-red-700', 'bg-red-500'],
  nonaktif: ['Nonaktif', 'bg-slate-100 text-slate-600', 'bg-slate-400'],
  aktif: ['Aktif', 'bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
  baru: ['Baru', 'bg-red-50 text-red-700', 'bg-red-500'],
  ditangani: ['Ditangani', 'bg-amber-50 text-amber-800', 'bg-amber-500'],
  selesai: ['Selesai', 'bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
  connected: ['Terhubung', 'bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
  disconnected: ['Terputus', 'bg-red-50 text-red-700', 'bg-red-500'],
}

export function StatusBadge({ status }) {
  const [label, tone, dot] = STATUS[status] ?? STATUS.nonaktif
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', tone)}>
      <span className={cx('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

const CONTROL =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-canvas disabled:text-muted'

export function Input({ className, ...props }) {
  return <input className={cx(CONTROL, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(CONTROL, className)} {...props}>
      {children}
    </select>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl bg-canvas p-1">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cx(
            'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
            value === key ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ children }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>
}

/** Tabel dengan gulir horizontal di layar sempit. */
export function Table({ head, children, minWidth = 640 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ className, children }) {
  return <td className={cx('px-3 py-3 align-middle', className)}>{children}</td>
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-muted hover:bg-canvas">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
