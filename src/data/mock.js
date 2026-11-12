// Data tiruan untuk tampilan. Ganti dengan panggilan API backend saat sudah tersedia.

export const STEP = 5 * 60 * 1000
export const NOW = Date.now()
const LAST_SLOT = Math.floor(NOW / STEP) * STEP
const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

function mulberry32(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (value, digits) => Number(value.toFixed(digits))

/** 7 hari data per 5 menit untuk satu node, termasuk paket hilang (loncatan nomor paket). */
function generate(nodeId, { rssi, snr, stopAgo = 0, lossRate, blockGap }) {
  const rnd = mulberry32(nodeId * 7919)
  const rows = []
  const total = 7 * 288
  const lossWindow = []
  let packet = 1000 * nodeId
  let prevPacket = null

  for (let i = total; i >= 0; i--) {
    const t = LAST_SLOT - i * STEP
    if (t > LAST_SLOT - stopAgo) break
    packet++

    const lost = rnd() < lossRate || (blockGap && i <= blockGap[0] && i > blockGap[1])
    lossWindow.push(lost ? 1 : 0)
    if (lossWindow.length > 100) lossWindow.shift()

    const hour = (t / HOUR + 7) % 24
    const day = Math.floor((t + 7 * HOUR) / DAY)
    const cloud = 0.65 + (0.35 * (((day * 2654435761 * nodeId) >>> 0) % 1000)) / 1000
    const sun = hour > 6 && hour < 18 ? Math.sin((Math.PI * (hour - 6)) / 12) : 0
    const s = sun * cloud * (0.9 + 0.2 * rnd())

    const voltage = 12.1 + 1.9 * s + (rnd() - 0.5) * 0.1
    const current = 0.08 + 4.2 * s + (rnd() - 0.5) * 0.04
    const temperature = 24 + 2 * Math.sin((Math.PI * (hour - 9)) / 12) + 16 * s + (rnd() - 0.5) * 0.6
    const rssiNow = Math.round(rssi + (rnd() - 0.5) * 8)
    const snrNow = snr + (rnd() - 0.5) * 3
    if (lost) continue

    rows.push({
      id: `${nodeId}-${packet}`,
      device_id: nodeId,
      packet_no: packet,
      gap: prevPacket == null ? 0 : packet - prevPacket - 1,
      temperature: round(temperature, 1),
      voltage: round(voltage, 2),
      current: round(current, 2),
      power: round(voltage * current, 1),
      irradiance: Math.round(1000 * s),
      rssi: rssiNow,
      snr: round(snrNow, 1),
      packet_loss: round((100 * lossWindow.reduce((a, b) => a + b, 0)) / lossWindow.length, 1),
      recorded_at: t + 2000 + nodeId * 1500,
    })
    prevPacket = packet
  }
  return rows
}

export const measurements = {
  1: generate(1, { rssi: -72, snr: 9.5, lossRate: 0.01 }),
  2: generate(2, { rssi: -88, snr: 6, lossRate: 0.03, blockGap: [370, 362] }),
  3: generate(3, { rssi: -103, snr: 1.5, lossRate: 0.08, stopAgo: 130 * MIN }),
}

const lastSeen = (id) => measurements[id].at(-1)?.recorded_at ?? null

export const gateway = {
  id: 1,
  nama: 'Gateway LoRa Utama',
  lokasi: 'Ruang Kontrol, Gedung A',
  status: 'online',
  last_seen: LAST_SLOT + 9000,
  mqtt_status: 'connected',
  internet_status: 'connected',
  beacon_menit: 5,
  broker: 'mqtt.omahiot.example:8883',
  topic: 'omahiot/gateway-1/node/+/data',
  ip_lokal: '192.168.1.50',
}

export const devices = [
  { id: 1, node_id: 1, nama: 'Node 1 — Atap Gedung A', lokasi: 'Gedung A, Atap', gateway_id: 1, aktif: true, last_seen: lastSeen(1) },
  { id: 2, node_id: 2, nama: 'Node 2 — Atap Gedung B', lokasi: 'Gedung B, Atap', gateway_id: 1, aktif: true, last_seen: lastSeen(2) },
  { id: 3, node_id: 3, nama: 'Node 3 — Area Parkir', lokasi: 'Area Parkir Timur', gateway_id: 1, aktif: true, last_seen: lastSeen(3) },
]

// Akun demo. Kata sandi untuk semua akun: "password" (hanya tiruan di sisi tampilan).
export const users = [
  { id: 1, nama: 'Rina Wulandari', email: 'superadmin@omahiot.example', username: 'superadmin', role: 'Super Admin', aktif: true, deviceIds: [] },
  { id: 2, nama: 'Dimas Saputra', email: 'admin@omahiot.example', username: 'admin', role: 'Admin', aktif: true, deviceIds: [1, 2] },
  { id: 3, nama: 'Sari Lestari', email: 'sari@omahiot.example', username: 'sari', role: 'Admin', aktif: false, deviceIds: [3] },
]

export const thresholds = {
  global: {
    temperature: { min: 0, max: 60 },
    voltage: { min: 10.5, max: 14.8 },
    current: { min: 0, max: 6 },
    power: { min: 0, max: 80 },
    irradiance: { min: 0, max: 1200 },
  },
  devices: {
    2: { temperature: { min: null, max: 40 } },
  },
}

export const settings = {
  timezone: 'WIB',
  retentionDays: 365,
  offlineMinutes: 15,
  exportFormat: 'comma',
  exportTime: 'local',
}

export const alerts = [
  { id: 1, device_id: 3, jenis: 'offline', sensor: null, nilai: null, batas: null, ambang: null, waktu: lastSeen(3) + 15 * MIN, status: 'baru', ditangani_oleh: null },
  { id: 2, device_id: 2, jenis: 'ambang', sensor: 'temperature', nilai: 41.3, batas: 'max', ambang: 40, waktu: NOW - 40 * MIN, status: 'baru', ditangani_oleh: null },
  { id: 3, device_id: 1, jenis: 'ambang', sensor: 'voltage', nilai: 10.3, batas: 'min', ambang: 10.5, waktu: NOW - 5 * HOUR, status: 'ditangani', ditangani_oleh: 2 },
  { id: 4, device_id: 3, jenis: 'ambang', sensor: 'irradiance', nilai: 1236, batas: 'max', ambang: 1200, waktu: NOW - 26 * HOUR, status: 'ditangani', ditangani_oleh: 1 },
  { id: 5, device_id: 2, jenis: 'ambang', sensor: 'power', nilai: 84.6, batas: 'max', ambang: 80, waktu: NOW - 2 * DAY, status: 'selesai', ditangani_oleh: 2 },
  { id: 6, device_id: 1, jenis: 'offline', sensor: null, nilai: null, batas: null, ambang: null, waktu: NOW - 3 * DAY, status: 'selesai', ditangani_oleh: 1 },
]

export const logs = [
  { id: 1, user_id: 1, aksi: 'Tambah perangkat', objek: 'Node 3 — Area Parkir', detail: 'Perangkat baru didaftarkan ke Gateway LoRa Utama', waktu: NOW - 6 * DAY },
  { id: 2, user_id: 1, aksi: 'Tetapkan perangkat', objek: 'Dimas Saputra', detail: 'Ditugaskan mengelola Node 1 dan Node 2', waktu: NOW - 6 * DAY + HOUR },
  { id: 3, user_id: 2, aksi: 'Ubah ambang', objek: 'Node 2 — Atap Gedung B', detail: 'Suhu: batas atas diubah menjadi 40 °C', waktu: NOW - 4 * DAY },
  { id: 4, user_id: 1, aksi: 'Ubah pengaturan', objek: 'Sistem', detail: 'Batas waktu offline: 15 menit', waktu: NOW - 3 * DAY - 2 * HOUR },
  { id: 5, user_id: 2, aksi: 'Tangani peringatan', objek: 'Node 2 — Atap Gedung B', detail: 'Status diubah menjadi Selesai', waktu: NOW - 2 * DAY + 3 * HOUR },
  { id: 6, user_id: 1, aksi: 'Nonaktifkan pengguna', objek: 'Sari Lestari', detail: 'Akun dinonaktifkan', waktu: NOW - 30 * HOUR },
  { id: 7, user_id: 2, aksi: 'Tangani peringatan', objek: 'Node 1 — Atap Gedung A', detail: 'Status diubah menjadi Ditangani', waktu: NOW - 4 * HOUR },
]
