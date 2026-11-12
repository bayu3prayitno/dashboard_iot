import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AppProvider from './context/AppProvider.jsx'
import { useApp } from './context/store.js'
import ActivityLog from './pages/ActivityLog.jsx'
import Alerts from './pages/Alerts.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import Devices from './pages/Devices.jsx'
import GatewayPage from './pages/GatewayPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

function Protected() {
  const { user } = useApp()
  return user ? <Layout /> : <Navigate to="/login" replace />
}

function SuperOnly({ children }) {
  const { isSuper } = useApp()
  return isSuper ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route index element={<Dashboard />} />
            <Route path="perangkat" element={<Devices />} />
            <Route path="perangkat/:id" element={<DeviceDetail />} />
            <Route path="histori" element={<HistoryPage />} />
            <Route path="peringatan" element={<Alerts />} />
            <Route path="gateway" element={<GatewayPage />} />
            <Route path="pengguna" element={<SuperOnly><UsersPage /></SuperOnly>} />
            <Route path="pengaturan" element={<SuperOnly><SettingsPage /></SuperOnly>} />
            <Route path="log" element={<ActivityLog />} />
            <Route path="profil" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
