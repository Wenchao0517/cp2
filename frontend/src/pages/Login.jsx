import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const C = { green:'#00C48C', border:'#E8EDF2', text:'#1A2332', muted:'#6B7A8F', red:'#FF6B6B' }

const IcoWave = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)
const IcoMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await login(email, password)
      if (!data.user.consent_accepted) navigate('/disclaimer')
      else if (data.user.role === 'doctor') navigate('/clinician')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#F0FDF8 0%,#E8F4FD 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>

      <div style={{marginBottom:28,textAlign:'center'}}>
        <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#00C48C,#00A070)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
          <IcoWave/>
        </div>
        <h1 style={{fontSize:24,fontWeight:700,color:C.text,margin:0,letterSpacing:'-0.4px'}}>DiabetesGuard</h1>
        <p style={{fontSize:13,color:C.muted,margin:'4px 0 0'}}>Diabetes Risk Assessment Platform</p>
      </div>

      <div style={{background:'#fff',borderRadius:20,padding:'32px 36px',width:'100%',maxWidth:400,boxShadow:'0 4px 24px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04)'}}>
        <h2 style={{fontSize:18,fontWeight:700,color:C.text,margin:'0 0 6px',letterSpacing:'-0.3px'}}>Welcome back</h2>
        <p style={{fontSize:13,color:C.muted,margin:'0 0 24px'}}>Sign in to your account to continue</p>

        {error && (
          <div style={{background:'#FEF2F2',border:'1px solid #FECACA',color:C.red,padding:'10px 14px',borderRadius:10,marginBottom:18,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.6px'}}>Email address</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.muted}}><IcoMail/></span>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                style={{width:'100%',padding:'11px 12px 11px 36px',border:'1.5px solid '+C.border,borderRadius:10,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',color:C.text}}/>
            </div>
          </div>

          <div style={{marginBottom:22}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.6px'}}>Password</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.muted}}><IcoLock/></span>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"
                style={{width:'100%',padding:'11px 12px 11px 36px',border:'1.5px solid '+C.border,borderRadius:10,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',color:C.text}}/>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#00C48C,#00A070)',color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',opacity:loading?0.7:1,fontFamily:'inherit',letterSpacing:'-0.2px'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{marginTop:20,textAlign:'center',fontSize:13,color:C.muted}}>
          Don't have an account?{' '}
          <Link to="/register" style={{color:C.green,fontWeight:600,textDecoration:'none'}}>Create account</Link>
        </div>
      </div>

      <p style={{marginTop:20,fontSize:11,color:C.muted,textAlign:'center',maxWidth:340}}>
        This platform is for screening purposes only and does not constitute medical advice.
      </p>
    </div>
  )
}
