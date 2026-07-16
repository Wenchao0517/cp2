import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useIsMobile from '../hooks/useIsMobile'

const F = "'Plus Jakarta Sans',-apple-system,sans-serif"

const IcoHeart = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const IcoShield = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoChart = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoBrain = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
const IcoMail = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IcoLock = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoEye = ({off}) => off
  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [focus, setFocus] = useState('')
  const isMobile = useIsMobile()

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await login(form.email, form.password)
      if (data.consent_required || !data.user?.consent_accepted) navigate('/disclaimer')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    }
    setLoading(false)
  }

  const inputStyle = (name) => ({
    width:'100%', padding:'13px 14px 13px 42px', borderRadius:12, fontSize:14.5, fontFamily:F,
    border:'2px solid ' + (focus===name ? '#00C48C' : '#E8EDF2'),
    outline:'none', boxSizing:'border-box', transition:'border 0.2s, box-shadow 0.2s',
    boxShadow: focus===name ? '0 0 0 4px #00C48C1A' : 'none', background:'#FBFDFC'
  })

  return (
    <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',fontFamily:F}}>

      {/* Left brand panel */}
      <div style={{position:'relative',overflow:'hidden',background:'linear-gradient(145deg,#00C48C 0%,#00A878 45%,#047857 100%)',display:isMobile?'none':'flex',flexDirection:'column',justifyContent:'center',padding:'0 8%'}}>
        {/* decorative circles */}
        <div style={{position:'absolute',width:420,height:420,borderRadius:'50%',background:'rgba(255,255,255,0.07)',top:-120,right:-120}}/>
        <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,0.06)',bottom:-80,left:-60}}/>
        <div style={{position:'absolute',width:140,height:140,borderRadius:'50%',border:'2px dashed rgba(255,255,255,0.25)',top:'18%',left:'12%'}}/>

        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:40}}>
            <div style={{width:46,height:46,borderRadius:14,background:'rgba(255,255,255,0.18)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
              <IcoHeart/>
            </div>
            <span style={{fontSize:24,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>DiabetesGuard</span>
          </div>

          <h1 style={{fontSize:38,fontWeight:800,color:'#fff',lineHeight:1.15,letterSpacing:'-1px',margin:'0 0 16px'}}>
            Know your risk.<br/>Take control early.
          </h1>
          <p style={{fontSize:15.5,color:'rgba(255,255,255,0.85)',lineHeight:1.7,maxWidth:420,marginBottom:44}}>
            AI-powered diabetes risk assessment with real-time glucose tracking, explainable predictions, and personalised recommendations.
          </p>

          {[
            [<IcoBrain key="b"/>, 'ML risk prediction', 'Random Forest model trained on 100,000 clinical records'],
            [<IcoChart key="c"/>, 'Glucose analytics', 'Trends, alerts and estimated HbA1c at a glance'],
            [<IcoShield key="s"/>, 'Clinician connected', 'Share your data securely with your doctor'],
          ].map(([icon, title, sub], i) => (
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:20}}>
              <div style={{width:38,height:38,borderRadius:11,background:'rgba(255,255,255,0.16)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0}}>
                {icon}
              </div>
              <div>
                <div style={{fontSize:14.5,fontWeight:700,color:'#fff'}}>{title}</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginTop:2}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',padding:'40px 24px'}}>
        <div style={{width:'100%',maxWidth:400}}>
          <h2 style={{fontSize:26,fontWeight:800,color:'#1A2332',margin:'0 0 6px',letterSpacing:'-0.5px'}}>Welcome back</h2>
          <p style={{fontSize:14,color:'#6B7A8F',margin:'0 0 32px'}}>Sign in to continue to your dashboard</p>

          {error && (
            <div style={{background:'#FEF2F2',border:'1px solid #FECACA',color:'#DC2626',padding:'11px 16px',borderRadius:12,fontSize:13.5,fontWeight:600,marginBottom:20}}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <label style={{display:'block',fontSize:12.5,fontWeight:700,color:'#374151',marginBottom:7,letterSpacing:'0.2px'}}>EMAIL</label>
            <div style={{position:'relative',marginBottom:20}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focus==='email'?'#00C48C':'#9CA3AF',transition:'color 0.2s'}}><IcoMail/></span>
              <input type="email" required value={form.email}
                onChange={e=>setForm({...form,email:e.target.value})}
                onFocus={()=>setFocus('email')} onBlur={()=>setFocus('')}
                placeholder="you@example.com" style={inputStyle('email')}/>
            </div>

            <label style={{display:'block',fontSize:12.5,fontWeight:700,color:'#374151',marginBottom:7,letterSpacing:'0.2px'}}>PASSWORD</label>
            <div style={{position:'relative',marginBottom:28}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focus==='pw'?'#00C48C':'#9CA3AF',transition:'color 0.2s'}}><IcoLock/></span>
              <input type={showPw?'text':'password'} required value={form.password}
                onChange={e=>setForm({...form,password:e.target.value})}
                onFocus={()=>setFocus('pw')} onBlur={()=>setFocus('')}
                placeholder="Enter your password" style={{...inputStyle('pw'),paddingRight:44}}/>
              <button type="button" onClick={()=>setShowPw(!showPw)}
                style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex'}}>
                <IcoEye off={showPw}/>
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'14px',background:loading?'#7DD8BC':'linear-gradient(135deg,#00C48C,#00A878)',color:'#fff',border:'none',borderRadius:12,fontSize:15.5,fontWeight:700,cursor:loading?'default':'pointer',fontFamily:F,boxShadow:'0 8px 20px rgba(0,196,140,0.35)',transition:'transform 0.15s, box-shadow 0.15s'}}
              onMouseOver={e=>{if(!loading){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 12px 26px rgba(0,196,140,0.42)'}}}
              onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 8px 20px rgba(0,196,140,0.35)'}}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{textAlign:'center',fontSize:14,color:'#6B7A8F',marginTop:28}}>
            New to DiabetesGuard?{' '}
            <Link to="/register" style={{color:'#00A878',fontWeight:700,textDecoration:'none'}}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
