import { useRef, useState } from 'react'
import * as seed from '../data/mock.js'
import { AppContext } from './store.js'

const STATUS_LABEL = { baru: 'Baru', ditangani: 'Ditangani', selesai: 'Selesai' }

function readSession() {
  try {
    return Number(sessionStorage.getItem('uid')) || null
  } catch {
    return null
  }
}

function writeSession(id) {
  try {
    if (id) sessionStorage.setItem('uid', String(id))
    else sessionStorage.removeItem('uid')
  } catch {
    // penyimpanan sesi tidak tersedia; login tetap berlaku sampai halaman dimuat ulang
  }
}

/** State aplikasi di memori. Semua perubahan hilang saat halaman dimuat ulang (belum ada backend). */
export default function AppProvider({ children }) {
  const [users, setUsers] = useState(seed.users)
  const [userId, setUserId] = useState(readSession)
  const [devices, setDevices] = useState(seed.devices)
  const [gateway, setGateway] = useState(seed.gateway)
  const [alerts, setAlerts] = useState(seed.alerts)
  const [thresholds, setThresholds] = useState(seed.thresholds)
  const [settings, setSettings] = useState(seed.settings)
  const [logs, setLogs] = useState(seed.logs)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const user = users.find((u) => u.id === userId && u.aktif) ?? null
  const isSuper = user?.role === 'Super Admin'

  const notify = (message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const log = (aksi, objek, detail) =>
    setLogs((list) => [
      { id: list.length + 1, user_id: userId, aksi, objek, detail, waktu: Date.now() },
      ...list,
    ])

  // ---- Autentikasi (tiruan) ----
  const login = (identifier, password) => {
    const key = identifier.trim().toLowerCase()
    const found = users.find((u) => u.email.toLowerCase() === key || u.username.toLowerCase() === key)
    if (!found || password !== 'password') return 'Email/username atau kata sandi salah.'
    if (!found.aktif) return 'Akun ini dinonaktifkan. Hubungi Super Admin.'
    setUserId(found.id)
    writeSession(found.id)
    return null
  }

  const logout = () => {
    setUserId(null)
    writeSession(null)
  }

  // ---- Hak akses ----
  const canManage = (deviceId) => isSuper || Boolean(user?.deviceIds.includes(deviceId))
  const visibleDevices = devices.filter((d) => canManage(d.id))
  const visibleAlerts = alerts
    .filter((a) => canManage(a.device_id))
    .sort((a, b) => b.waktu - a.waktu)
  const activeAlerts = visibleAlerts.filter((a) => a.status !== 'selesai')

  // ---- Perangkat ----
  const deviceStatus = (device) => {
    if (!device.aktif) return 'nonaktif'
    if (!device.last_seen) return 'offline'
    return seed.NOW - device.last_seen <= settings.offlineMinutes * 60000 ? 'online' : 'offline'
  }
  const rowsOf = (deviceId) => seed.measurements[deviceId] ?? []
  const latestOf = (deviceId) => rowsOf(deviceId).at(-1) ?? null

  const addDevice = (data) => {
    const id = Math.max(0, ...devices.map((d) => d.id)) + 1
    setDevices((list) => [...list, { ...data, id, aktif: true, last_seen: null }])
    if (!isSuper) {
      setUsers((list) =>
        list.map((u) => (u.id === userId ? { ...u, deviceIds: [...u.deviceIds, id] } : u)),
      )
    }
    log('Tambah perangkat', data.nama, `Node ID ${data.node_id}, lokasi ${data.lokasi}`)
    notify('Perangkat ditambahkan.')
  }

  const updateDevice = (id, data) => {
    setDevices((list) => list.map((d) => (d.id === id ? { ...d, ...data } : d)))
    log('Ubah perangkat', data.nama, 'Identitas/lokasi perangkat diperbarui')
    notify('Perangkat diperbarui.')
  }

  const toggleDevice = (device) => {
    setDevices((list) => list.map((d) => (d.id === device.id ? { ...d, aktif: !d.aktif } : d)))
    log(device.aktif ? 'Nonaktifkan perangkat' : 'Aktifkan perangkat', device.nama, '')
    notify(device.aktif ? 'Perangkat dinonaktifkan.' : 'Perangkat diaktifkan.')
  }

  // ---- Peringatan & ambang ----
  const setAlertStatus = (alert, status) => {
    setAlerts((list) =>
      list.map((a) => (a.id === alert.id ? { ...a, status, ditangani_oleh: userId } : a)),
    )
    const device = devices.find((d) => d.id === alert.device_id)
    log('Tangani peringatan', device?.nama ?? '—', `Status diubah menjadi ${STATUS_LABEL[status]}`)
    notify(`Peringatan ditandai ${STATUS_LABEL[status]}.`)
  }

  const effectiveThreshold = (deviceId, sensor) => {
    const own = thresholds.devices[deviceId]?.[sensor]
    const base = thresholds.global[sensor]
    return { min: own?.min ?? base.min, max: own?.max ?? base.max }
  }

  const saveThresholds = (scope, values) => {
    if (scope === 'global') {
      setThresholds((t) => ({ ...t, global: values }))
      log('Ubah ambang', 'Global', 'Ambang peringatan global diperbarui')
    } else {
      setThresholds((t) => ({ ...t, devices: { ...t.devices, [scope]: values } }))
      const device = devices.find((d) => d.id === scope)
      log('Ubah ambang', device?.nama ?? '—', 'Ambang peringatan perangkat diperbarui')
    }
    notify('Ambang peringatan disimpan.')
  }

  // ---- Gateway & pengaturan ----
  const updateGateway = (data) => {
    setGateway((g) => ({ ...g, ...data }))
    log('Ubah gateway', data.nama, 'Identitas/lokasi gateway diperbarui')
    notify('Gateway diperbarui.')
  }

  const updateSettings = (data, detail = 'Pengaturan sistem diperbarui') => {
    setSettings((s) => ({ ...s, ...data }))
    log('Ubah pengaturan', 'Sistem', detail)
    notify('Pengaturan disimpan.')
  }

  // ---- Pengguna ----
  const addUser = (data) => {
    const id = Math.max(0, ...users.map((u) => u.id)) + 1
    setUsers((list) => [...list, { ...data, id }])
    log('Tambah pengguna', data.nama, `Role ${data.role}`)
    notify('Pengguna ditambahkan.')
  }

  const updateUser = (id, data) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...data } : u)))
    log('Ubah pengguna', data.nama, `Role ${data.role}`)
    notify('Pengguna diperbarui.')
  }

  const toggleUser = (target) => {
    setUsers((list) => list.map((u) => (u.id === target.id ? { ...u, aktif: !u.aktif } : u)))
    log(target.aktif ? 'Nonaktifkan pengguna' : 'Aktifkan pengguna', target.nama, '')
    notify(target.aktif ? 'Pengguna dinonaktifkan.' : 'Pengguna diaktifkan.')
  }

  const updateProfile = (data) => {
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, ...data } : u)))
    log('Ubah profil', data.nama, 'Profil diperbarui')
    notify('Profil disimpan.')
  }

  const changePassword = () => {
    log('Ubah kata sandi', user.nama, '')
    notify('Kata sandi diperbarui.')
  }

  const value = {
    user, users, isSuper, login, logout,
    devices, visibleDevices, canManage, deviceStatus, rowsOf, latestOf,
    addDevice, updateDevice, toggleDevice,
    visibleAlerts, activeAlerts, setAlertStatus,
    thresholds, effectiveThreshold, saveThresholds,
    gateway, updateGateway, settings, updateSettings,
    addUser, updateUser, toggleUser, updateProfile, changePassword,
    logs, toast, notify,
    zone: settings.timezone,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
