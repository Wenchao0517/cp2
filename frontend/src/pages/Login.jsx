import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (!data.user.consent_accepted) navigate('/disclaimer')
      else if (data.user.role === 'doctor') navigate('/clinician')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🩺</div>
        <h1 style={styles.title}>DiabetesGuard</h1>
        <p style={styles.subtitle}>Diabetes Risk Assessment Platform</p>
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} required placeholder="you@email.com"/>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} required placeholder="••••••••"/>
          </div>
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.link}>Don't have an account? <Link to="/register" style={styles.a}>Register</Link></p>
      </div>
    </div>
  )
}

const styles = {
  page:     { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' },
  card:     { background:'#fff', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  logo:     { fontSize:48, textAlign:'center', marginBottom:8 },
  title:    { fontSize:28, fontWeight:700, textAlign:'center', color:'#2d3748' },
  subtitle: { textAlign:'center', color:'#718096', marginBottom:24, fontSize:14 },
  error:    { background:'#fed7d7', color:'#c53030', padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:14 },
  field:    { marginBottom:16 },
  label:    { display:'block', marginBottom:6, fontWeight:600, fontSize:14, color:'#4a5568' },
  input:    { width:'100%', padding:'10px 14px', border:'2px solid #e2e8f0', borderRadius:8, fontSize:15, outline:'none' },
  btn:      { width:'100%', padding:'12px', background:'#667eea', color:'#fff', border:'none', borderRadius:8, fontSize:16, fontWeight:600, marginTop:8 },
  link:     { textAlign:'center', marginTop:20, fontSize:14, color:'#718096' },
  a:        { color:'#667eea', fontWeight:600 },
}
