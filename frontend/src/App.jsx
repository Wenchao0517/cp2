import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Disclaimer from './pages/Disclaimer'
import PatientDashboard from './pages/PatientDashboard'
import ClinicianDashboard from './pages/ClinicianDashboard'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (!user.consent_accepted) return <Navigate to="/disclaimer" />
  if (role && user.role !== role) return <Navigate to="/" />
  return children
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (!user.consent_accepted) return <Navigate to="/disclaimer" />
  return user.role === 'doctor'
    ? <Navigate to="/clinician" />
    : <Navigate to="/dashboard" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<HomeRedirect />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/dashboard"  element={
            <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>
          }/>
          <Route path="/clinician"  element={
            <ProtectedRoute role="doctor"><ClinicianDashboard /></ProtectedRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
