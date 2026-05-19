import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api/endpoints'

export default function Register() {
  const [form, setForm]     = useState({ email:'', password:'', full_name:'', role:'patient', license_number:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🩺</div>
        <h1 style={styles.title}>Create Account</h1>
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} name="full_name" value={form.full_name} onChange={handle} required placeholder="Your full name"/>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} name="email" type="email" value={form.email} onChange={handle} required placeholder="you@email.com"/>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} name="password" type="password" value={form.password} onChange={handle} required placeholder="Min 8 characters"/>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>I am a</label>
            <select style={styles.input} name="role" value={form.role} onChange={handle}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor / Clinician</option>
            </select>
          </div>
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.link}>Already have an account? <Link to="/login" style={styles.a}>Sign in</Link></p>
      </div>
    </div>
  )
}

const styles = {
  page:   { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' },
  card:   { background:'#fff', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  logo:   { fontSize:48, textAlign:'center', marginBottom:8 },
  title:  { fontSize:26, fontWeight:700, textAlign:'center', color:'#2d3748', marginBottom:24 },
  error:  { background:'#fed7d7', color:'#c53030', padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:14 },
  field:  { marginBottom:16 },
  label:  { display:'block', marginBottom:6, fontWeight:600, fontSize:14, color:'#4a5568' },
  input:  { width:'100%', padding:'10px 14px', border:'2px solid #e2e8f0', borderRadius:8, fontSize:15, outline:'none' },
  btn:    { width:'100%', padding:'12px', background:'#667eea', color:'#fff', border:'none', borderRadius:8, fontSize:16, fontWeight:600, marginTop:8 },
  link:   { textAlign:'center', marginTop:20, fontSize:14, color:'#718096' },
  a:      { color:'#667eea', fontWeight:600 },
}
