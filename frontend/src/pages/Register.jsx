import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/endpoints'
import useIsMobile from '../hooks/useIsMobile'

const F = "'Plus Jakarta Sans',-apple-system,sans-serif"

const IcoHeart = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const IcoUser = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoMail = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IcoLock = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoPatient = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoDoctor = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name:'', email:'', password:'', role:'patient' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState('')
  const isMobile = useIsMobile()

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await authAPI.register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
    setLoading(false)
  }

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 8 ? 1 : form.password.length < 12 ? 2 : 3
  const pwColors = ['#F0E6DE','#FF6B6B','#FFB020','#FF7A59']
  const pwLabels = ['','Weak','Medium','Strong']

  const inputStyle = (name) => ({
    width:'100%', padding:'13px 14px 13px 42px', borderRadius:12, fontSize:14.5, fontFamily:F,
    border:'2px solid ' + (focus===name ? '#FF7A59' : '#F0E6DE'),
    outline:'none', boxSizing:'border-box', transition:'border 0.2s, box-shadow 0.2s',
    boxShadow: focus===name ? '0 0 0 4px #FF7A591A' : 'none', background:'#FFFBF8'
  })

  return (
    <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',fontFamily:F}}>

      {/* Left brand panel */}
      <div style={{position:'relative',overflow:'hidden',background:'linear-gradient(145deg,#FF7A59 0%,#E85D3D 45%,#047857 100%)',display:isMobile?'none':'flex',flexDirection:'column',justifyContent:'center',padding:'0 8%'}}>
        <div style={{position:'absolute',width:420,height:420,borderRadius:'50%',background:'rgba(255,255,255,0.07)',top:-120,right:-120}}/>
        <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,0.06)',bottom:-80,left:-60}}/>
        <div style={{position:'absolute',width:140,height:140,borderRadius:'50%',border:'2px dashed rgba(255,255,255,0.25)',top:'15%',left:'10%'}}/>

        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:40}}>
            <div style={{width:46,height:46,borderRadius:14,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
              <IcoHeart/>
            </div>
            <span style={{fontSize:24,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>DiabetesGuard</span>
          </div>

          <h1 style={{fontSize:38,fontWeight:800,color:'#fff',lineHeight:1.15,letterSpacing:'-1px',margin:'0 0 16px'}}>
            Start your health<br/>journey today.
          </h1>
          <p style={{fontSize:15.5,color:'rgba(255,255,255,0.85)',lineHeight:1.7,maxWidth:420,marginBottom:40}}>
            Join DiabetesGuard and get instant access to AI-powered risk assessment and personalised health insights.
          </p>

          {['Free diabetes risk assessment','Track glucose with smart alerts','AI-generated lifestyle recommendations','Connect with your clinician'].map((t,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <IcoCheck/>
              </div>
              <span style={{fontSize:14.5,color:'#fff',fontWeight:500}}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',padding:'40px 24px',overflowY:'auto'}}>
        <div style={{width:'100%',maxWidth:400}}>
          <h2 style={{fontSize:26,fontWeight:800,color:'#171412',margin:'0 0 6px',letterSpacing:'-0.5px'}}>Create account</h2>
          <p style={{fontSize:14,color:'#8A7E76',margin:'0 0 28px'}}>Get started in less than a minute</p>

          {error && (
            <div style={{background:'#FEF2F2',border:'1px solid #FECACA',color:'#DC2626',padding:'11px 16px',borderRadius:12,fontSize:13.5,fontWeight:600,marginBottom:20}}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            {/* Role selector */}
            <label style={{display:'block',fontSize:12.5,fontWeight:700,color:'#374151',marginBottom:8,letterSpacing:'0.2px'}}>I AM A</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {[['patient','Patient',<IcoPatient key="p"/>],['doctor','Doctor / Clinician',<IcoDoctor key="d"/>]].map(([v,l,ico])=>(
                <button key={v} type="button" onClick={()=>setForm({...form,role:v})}
                  style={{padding:'14px 10px',borderRadius:12,cursor:'pointer',fontFamily:F,display:'flex',flexDirection:'column',alignItems:'center',gap:7,transition:'all 0.2s',
                    border:'2px solid '+(form.role===v?'#FF7A59':'#F0E6DE'),
                    background:form.role===v?'#FF7A590D':'#fff',
                    color:form.role===v?'#E85D3D':'#9CA3AF'}}>
                  {ico}
                  <span style={{fontSize:13,fontWeight:700,color:form.role===v?'#E85D3D':'#8A7E76'}}>{l}</span>
                </button>
              ))}
            </div>

            <label style={{display:'block',fontSize:12.5,fontWeight:700,color:'#374151',marginBottom:7,letterSpacing:'0.2px'}}>FULL NAME</label>
            <div style={{position:'relative',marginBottom:18}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focus==='name'?'#FF7A59':'#9CA3AF',transition:'color 0.2s'}}><IcoUser/></span>
              <input required value={form.full_name}
                onChange={e=>setForm({...form,full_name:e.target.value})}
                onFocus={()=>setFocus('name')} onBlur={()=>setFocus('')}
                placeholder="John Tan" style={inputStyle('name')}/>
            </div>

            <label style={{display:'block',fontSize:12.5,fontWeight:700,color:'#374151',marginBottom:7,letterSpacing:'0.2px'}}>EMAIL</label>
            <div style={{position:'relative',marginBottom:18}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focus==='email'?'#FF7A59':'#9CA3AF',transition:'color 0.2s'}}><IcoMail/></span>
              <input type="email" required value={form.email}
                onChange={e=>setForm({...form,email:e.target.value})}
                onFocus={()=>setFocus('email')} onBlur={()=>setFocus('')}
                placeholder="you@example.com" style={inputStyle('email')}/>
            </div>

            <label style={{display:'block',fontSize:12.5,fontWeight:700,color:'#374151',marginBottom:7,letterSpacing:'0.2px'}}>PASSWORD</label>
            <div style={{position:'relative',marginBottom:8}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focus==='pw'?'#FF7A59':'#9CA3AF',transition:'color 0.2s'}}><IcoLock/></span>
              <input type="password" required minLength={8} value={form.password}
                onChange={e=>setForm({...form,password:e.target.value})}
                onFocus={()=>setFocus('pw')} onBlur={()=>setFocus('')}
                placeholder="Min. 8 characters" style={inputStyle('pw')}/>
            </div>

            {/* Password strength */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:26}}>
              <div style={{flex:1,display:'flex',gap:4}}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{flex:1,height:4,borderRadius:2,background:pwStrength>=i?pwColors[pwStrength]:'#F0E6DE',transition:'background 0.3s'}}/>
                ))}
              </div>
              {pwStrength>0 && <span style={{fontSize:11.5,fontWeight:700,color:pwColors[pwStrength]}}>{pwLabels[pwStrength]}</span>}
            </div>

            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'14px',background:loading?'#7DD8BC':'linear-gradient(135deg,#FF7A59,#FF5C7A)',color:'#fff',border:'none',borderRadius:12,fontSize:15.5,fontWeight:700,cursor:loading?'default':'pointer',fontFamily:F,boxShadow:'0 8px 20px rgba(23,20,18,0.35)',transition:'transform 0.15s'}}
              onMouseOver={e=>{if(!loading)e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseOut={e=>{e.currentTarget.style.transform='none'}}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{textAlign:'center',fontSize:14,color:'#8A7E76',marginTop:24}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'#E85D3D',fontWeight:700,textDecoration:'none'}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
