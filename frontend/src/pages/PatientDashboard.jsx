import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { patientAPI, predictAPI } from '../api/endpoints'
import useIsMobile from '../hooks/useIsMobile'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const F = "'Plus Jakarta Sans',-apple-system,sans-serif"
const C = {
  green:'#00C48C', red:'#FF6B6B', yellow:'#FFB020', blue:'#3B82F6', purple:'#8B5CF6',
  bg:'#F6F9F8', card:'#FFFFFF', border:'#E8EDF2', text:'#1A2332', muted:'#6B7A8F',
  low:'#00C48C', moderate:'#FFB020', high:'#FF6B6B', very_high:'#DC2626',
}

/* ---------- Professional SVG icons ---------- */
const Ico = {
  logo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  drop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  up: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  down: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M10 3v6.34L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.34V3"/></svg>,
  list: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  warn: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bulb: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  target: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  out: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  grid: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  msg2: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  msg: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
}

const RiskGauge = ({ probability, risk_level }) => {
  const pct = Math.round((probability||0)*100)
  const color = C[risk_level] || C.blue
  const r = 58, circ = 2*Math.PI*r
  const offset = circ - (pct/100)*circ
  const label = (risk_level||'').replace('_',' ').toUpperCase()
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0'}}>
      <div style={{position:'relative'}}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="58" fill="none" stroke="#F0F4F3" strokeWidth="13"/>
          <circle cx="75" cy="75" r="58" fill="none" stroke={color} strokeWidth="13"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 75 75)" style={{transition:'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)'}}/>
          <text x="75" y="70" textAnchor="middle" fontSize="30" fontWeight="800" fill={color} fontFamily={F}>{pct}%</text>
          <text x="75" y="90" textAnchor="middle" fontSize="11" fill={C.muted} fontFamily={F}>probability</text>
        </svg>
      </div>
      <div style={{background:color,color:'#fff',padding:'5px 22px',borderRadius:20,fontWeight:800,fontSize:13,marginTop:6,letterSpacing:'0.8px',boxShadow:`0 6px 16px ${color}55`}}>{label}</div>
    </div>
  )
}

const StatCard = ({ label, value, unit, color, icon }) => {
  const isMobile = useIsMobile()
  return (
  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:isMobile?'13px 13px':'18px 20px',display:'flex',alignItems:'center',gap:isMobile?9:14,transition:'transform 0.15s, box-shadow 0.15s',cursor:'default'}}
    onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 24px rgba(26,35,50,0.07)'}}
    onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
    <div style={{width:isMobile?36:46,height:isMobile?36:46,borderRadius:11,background:color+'16',display:'flex',alignItems:'center',justifyContent:'center',color:color,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:isMobile?18:23,fontWeight:800,color:C.text,letterSpacing:'-0.5px'}}>{value}<span style={{fontSize:12.5,color:C.muted,marginLeft:4,fontWeight:600}}>{unit}</span></div>
      <div style={{fontSize:12,color:C.muted,marginTop:2,fontWeight:600}}>{label}</div>
    </div>
  </div>
)}

const Tip = ({ active, payload }) => {
  if (!active||!payload?.length) return null
  return <div style={{background:'#1A2332',borderRadius:10,padding:'8px 14px',color:'#fff',fontSize:13,fontFamily:F}}><div style={{color:'#aaa',fontSize:11}}>{payload[0]?.payload?.time}</div><div style={{fontWeight:700,color:C.green}}>{payload[0].value} mmol/L</div></div>
}

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [readings, setReadings]     = useState([])
  const [assessment, setAssessment] = useState(null)
  const [form, setForm]             = useState({ glucose_mmol:'', meal_context:'fasting', notes:'' })
  const [msg, setMsg]               = useState({ text:'', type:'' })
  const [loading, setLoading]       = useState(false)
  const [tab, setTab]               = useState('overview')
  const [doctorNotes, setDoctorNotes] = useState([])
  const [riskHistory, setRiskHistory] = useState([])
  const [profileDone, setProfileDone] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)

  useEffect(() => {
    patientAPI.getGlucose().then(r => setReadings(r.data.readings))
    predictAPI.getLatest().then(r => setAssessment(r.data.assessment))
    patientAPI.getNotes().then(r => setDoctorNotes(r.data.notes)).catch(()=>{})
    patientAPI.getAssessments().then(r => setRiskHistory(r.data.assessments || [])).catch(()=>{})
    patientAPI.getProfile().then(r => {
      const p = r.data.patient
      setProfileDone(!!(p.height_cm && p.weight_kg))
    }).catch(()=>{})
  }, [])

  const flash = (text, type='ok') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3500) }

  const fillDemo = (type) => {
    const demo = type === 'high'
      ? { glucose_mmol: (12 + Math.random()*6).toFixed(1), meal_context: 'fasting', notes: 'demo data' }
      : { glucose_mmol: (4.5 + Math.random()*2).toFixed(1), meal_context: 'fasting', notes: 'demo data' }
    setForm(demo)
  }

  const addReading = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await patientAPI.addGlucose({...form, glucose_mmol:parseFloat(form.glucose_mmol), measured_at:new Date().toISOString()})
      const r = await patientAPI.getGlucose(); setReadings(r.data.readings)
      setForm({glucose_mmol:'',meal_context:'fasting',notes:''})
      flash('Reading logged - updating risk...')
      try {
        const a = await predictAPI.runAssessment()
        setAssessment(a.data.assessment)
        patientAPI.getAssessments().then(res => setRiskHistory(res.data.assessments || [])).catch(()=>{})
      } catch(err) { /* assessment optional here */ }
    } catch(e){ flash(e.response?.data?.error||'Error','err') }
    setLoading(false)
  }

  const deleteReading = async (id) => {
    if (!window.confirm('Delete this reading?')) return
    try {
      await patientAPI.deleteGlucose(id)
      const r = await patientAPI.getGlucose(); setReadings(r.data.readings)
      flash('Reading deleted')
    } catch(e){ flash('Delete failed','err') }
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setReplySending(true)
    try {
      const r = await patientAPI.replyNote(replyText.trim())
      setDoctorNotes([r.data.note, ...doctorNotes])
      setReplyText('')
      flash('Message sent to your doctor')
    } catch(e){ flash(e.response?.data?.error||'Failed to send','err') }
    setReplySending(false)
  }

  const runAssessment = async () => {
    setLoading(true)
    try { const r = await predictAPI.runAssessment(); setAssessment(r.data.assessment); flash('Assessment updated')
      patientAPI.getAssessments().then(res => setRiskHistory(res.data.assessments || [])).catch(()=>{}) }
    catch(e){ flash(e.response?.data?.error||'Failed','err') }
    setLoading(false)
  }

  const highReadings = readings.filter(r => r.glucose_mmol > 10)
  const lowReadings = readings.filter(r => r.glucose_mmol < 3.9)
  const chartData = [...readings].reverse().map((r,i)=>({ name:'#'+(i+1), glucose:r.glucose_mmol, time:r.measured_at?.slice(5,16).replace('T',' ') }))
  const avg = readings.length ? (readings.reduce((s,r)=>s+r.glucose_mmol,0)/readings.length).toFixed(1) : '--'
  const maxGlucose = readings.length ? Math.max(...readings.map(r=>r.glucose_mmol)) : '--'
  const minGlucose = readings.length ? Math.min(...readings.map(r=>r.glucose_mmol)) : '--'
  const hba1c = avg !== '--' ? ((parseFloat(avg) + 2.59) / 1.59).toFixed(1) : '--'
  const riskChartData = [...riskHistory].reverse().map(a => ({
    time: a.created_at?.slice(5,16).replace('T',' '),
    risk: Math.round((a.probability||0)*100)
  }))

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:F,overflowX:'hidden'}}>

      <nav style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid '+C.border,padding:isMobile?'0 14px':'0 28px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:11,background:'linear-gradient(135deg,#00C48C,#00A878)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(0,196,140,0.35)'}}>{Ico.logo}</div>
          <span style={{fontWeight:800,fontSize:18,color:C.text,letterSpacing:'-0.4px'}}>DiabetesGuard</span>
          {!isMobile && <span style={{fontSize:11,background:'#00C48C16',color:'#00A878',padding:'3px 10px',borderRadius:20,fontWeight:700,marginLeft:4,letterSpacing:'0.5px'}}>PATIENT</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?7:10}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#00C48C,#00A878)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:14}}>{user?.full_name?.[0]?.toUpperCase()}</div>
          {!isMobile && <span style={{fontSize:14,fontWeight:700,color:C.text}}>{user?.full_name}</span>}
          <button onClick={()=>navigate('/profile')}
            style={{display:'flex',alignItems:'center',gap:6,padding:isMobile?'8px 10px':'8px 16px',background:'#3B82F60D',color:C.blue,border:'1.5px solid #3B82F640',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F,transition:'all 0.15s'}}
            onMouseOver={e=>e.currentTarget.style.background='#3B82F61A'}
            onMouseOut={e=>e.currentTarget.style.background='#3B82F60D'}>
            {Ico.edit}{!isMobile && ' Edit Profile'}
          </button>
          <button onClick={logout} style={{display:'flex',alignItems:'center',gap:6,padding:isMobile?'8px 10px':'8px 16px',background:'transparent',color:C.muted,border:'1.5px solid '+C.border,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F}}>{isMobile?Ico.out:'Sign out'}</button>
        </div>
      </nav>

      {msg.text && <div style={{position:'fixed',top:76,right:24,zIndex:200,background:msg.type==='err'?C.red:C.green,color:'#fff',padding:'12px 22px',borderRadius:12,fontSize:14,fontWeight:700,boxShadow:'0 10px 30px rgba(0,0,0,0.18)',fontFamily:F}}>{msg.text}</div>}

      <div style={{maxWidth:1200,margin:'0 auto',padding:isMobile?'18px 14px':'28px 24px'}}>

        {highReadings.length > 0 && (
          <div style={{background:'#FFF5F5',border:'1.5px solid #FECACA',borderRadius:14,padding:'14px 20px',marginBottom:14,display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:38,height:38,borderRadius:10,background:'#FF6B6B1A',display:'flex',alignItems:'center',justifyContent:'center',color:C.red,flexShrink:0}}>{Ico.warn}</div>
            <div>
              <div style={{fontWeight:800,color:'#DC2626',fontSize:14}}>High Blood Glucose Alert</div>
              <div style={{fontSize:13,color:C.muted,marginTop:1}}>{highReadings.length} reading(s) above 10 mmol/L in your history. Please consult your doctor.</div>
            </div>
          </div>
        )}
        {lowReadings.length > 0 && (
          <div style={{background:'#FFFBF0',border:'1.5px solid #FDE68A',borderRadius:14,padding:'14px 20px',marginBottom:14,display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:38,height:38,borderRadius:10,background:'#FFB0201A',display:'flex',alignItems:'center',justifyContent:'center',color:C.yellow,flexShrink:0}}>{Ico.warn}</div>
            <div>
              <div style={{fontWeight:800,color:'#B45309',fontSize:14}}>Low Blood Glucose Alert</div>
              <div style={{fontSize:13,color:C.muted,marginTop:1}}>{lowReadings.length} reading(s) below 3.9 mmol/L detected. Risk of hypoglycemia.</div>
            </div>
          </div>
        )}

        <div style={{margin:'22px 0 24px'}}>
          <h1 style={{fontSize:isMobile?21:26,fontWeight:800,color:C.text,marginBottom:4,letterSpacing:'-0.6px'}}>Good day, {user?.full_name?.split(' ')[0]}</h1>
          <p style={{color:C.muted,fontSize:14,margin:0,fontWeight:500}}>Your personal diabetes risk monitor</p>
        </div>

        {(!profileDone || readings.length===0 || !assessment) && (
          <div style={{background:'linear-gradient(135deg,#F0FDF8,#F6FEFB)',border:'1.5px solid #00C48C40',borderRadius:18,padding:'20px 24px',marginBottom:24}}>
            <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:4}}>Get started with DiabetesGuard</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:16,fontWeight:500}}>Complete these steps to unlock your personalised risk assessment</div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:12}}>
              {[
                {done: profileDone, num:'1', title:'Complete your profile', sub:'Height, weight and medical history', action:()=>navigate('/profile')},
                {done: readings.length>0, num:'2', title:'Log a glucose reading', sub:'Enter a value from your glucometer', action:()=>setTab('log')},
                {done: !!assessment, num:'3', title:'Run your assessment', sub:'Get your AI-powered risk score', action:runAssessment},
              ].map((s,i)=>(
                <div key={i} onClick={s.done?undefined:s.action}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'#fff',border:'1.5px solid '+(s.done?'#00C48C50':C.border),borderRadius:14,cursor:s.done?'default':'pointer',opacity:s.done?0.75:1,transition:'all 0.15s'}}
                  onMouseOver={e=>{if(!s.done)e.currentTarget.style.borderColor='#00C48C'}}
                  onMouseOut={e=>{if(!s.done)e.currentTarget.style.borderColor=C.border}}>
                  <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,
                    background:s.done?'#00C48C':'#F0F4F3',color:s.done?'#fff':C.muted}}>
                    {s.done?'✓':s.num}
                  </div>
                  <div>
                    <div style={{fontSize:13.5,fontWeight:700,color:C.text,textDecoration:s.done?'line-through':'none'}}>{s.title}</div>
                    <div style={{fontSize:11.5,color:C.muted,marginTop:1}}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)',gap:isMobile?10:14,marginBottom:14}}>
          <StatCard label="Latest reading" value={readings[0]?.glucose_mmol??'--'} unit="mmol/L" color={C.green} icon={Ico.drop}/>
          <StatCard label="7-day average" value={avg} unit="mmol/L" color={C.blue} icon={Ico.chart}/>
          <StatCard label="7-day Max" value={maxGlucose} unit="mmol/L" color={C.red} icon={Ico.up}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)',gap:isMobile?10:14,marginBottom:26}}>
          <StatCard label="7-day Min" value={minGlucose} unit="mmol/L" color={C.purple} icon={Ico.down}/>
          <StatCard label="Est. HbA1c" value={hba1c} unit="%" color={C.yellow} icon={Ico.flask}/>
          <StatCard label="Total readings" value={readings.length} unit="" color={C.muted} icon={Ico.list}/>
        </div>

        <div style={{display:'flex',gap:4,marginBottom:22,background:C.card,border:'1px solid '+C.border,borderRadius:13,padding:4,width:isMobile?'100%':'fit-content'}}>
          {[['overview','Overview',Ico.grid],['log','Log Reading',Ico.plus],['history','History',Ico.list]].map(([k,l,ico])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:isMobile?5:7,padding:isMobile?'9px 8px':'9px 20px',flex:isMobile?1:'none',borderRadius:10,border:'none',cursor:'pointer',fontSize:isMobile?12.5:13.5,fontWeight:700,fontFamily:F,transition:'all 0.2s',whiteSpace:'nowrap',
                background:tab===k?'linear-gradient(135deg,#00C48C,#00A878)':'transparent',
                color:tab===k?'#fff':C.muted,
                boxShadow:tab===k?'0 4px 12px rgba(0,196,140,0.3)':'none'}}>
              {ico}{l}
            </button>
          ))}
        </div>

        {tab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?14:18}}>
            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:800,color:C.text,margin:0,display:'flex',alignItems:'center',gap:8}}><span style={{color:C.green}}>{Ico.target}</span> Risk Assessment</h2>
                <button onClick={runAssessment} disabled={loading}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',background:'linear-gradient(135deg,#00C48C,#00A878)',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',opacity:loading?0.7:1,fontFamily:F,boxShadow:'0 4px 12px rgba(0,196,140,0.3)'}}>
                  {Ico.refresh}{loading?'Updating...':'Update'}
                </button>
              </div>
              {assessment ? (
                <>
                  <RiskGauge probability={assessment.probability} risk_level={assessment.risk_level}/>
                  <div style={{marginTop:18}}>
                    <p style={{fontSize:11.5,fontWeight:800,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.8px'}}>Top Contributing Factors</p>
                    {assessment.top_factors?.slice(0,3).map((f,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<2?'1px solid '+C.border:'none'}}>
                        <span style={{fontSize:13.5,color:C.text,fontWeight:600}}>{f.feature}</span>
                        <span style={{fontSize:12,fontWeight:800,color:f.direction==='increase'?C.red:C.green,background:f.direction==='increase'?'#FF6B6B14':'#00C48C14',padding:'4px 12px',borderRadius:20}}>
                          {f.direction==='increase'?'Risk factor':'Protective'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center',padding:'36px 0',color:C.muted}}>
                  <div style={{color:C.border,marginBottom:10,display:'flex',justifyContent:'center'}}>{Ico.msg}</div>
                  <p style={{fontSize:14,margin:0,fontWeight:600}}>No assessment yet</p>
                  <p style={{fontSize:12.5,margin:'4px 0 0'}}>Add readings then click Update</p>
                </div>
              )}
            </div>

            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24}}>
              <h2 style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:16,display:'flex',alignItems:'center',gap:8}}><span style={{color:C.yellow}}>{Ico.bulb}</span> Recommendations</h2>
              {assessment?.recommendation ? (
                <div style={{fontSize:13.5,lineHeight:1.85,color:'#374151',background:'linear-gradient(135deg,#F0FDF8,#F6FEFB)',borderRadius:14,padding:18,borderLeft:'3px solid '+C.green}}>
                  {assessment.recommendation.split('\n').map((line,i)=>line.trim()&&<p key={i} style={{margin:'0 0 9px'}}>{line.replace(/\*\*/g,'')}</p>)}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'36px 0',color:C.muted}}>
                  <div style={{color:C.border,marginBottom:10,display:'flex',justifyContent:'center'}}>{Ico.msg}</div>
                  <p style={{fontSize:14,margin:0,fontWeight:600}}>Run an assessment to get personalised advice</p>
                </div>
              )}
            </div>

            {(doctorNotes.length>0 || true) && (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24,gridColumn:'1/-1'}}>
                <h2 style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:16,display:'flex',alignItems:'center',gap:8}}><span style={{color:C.blue}}>{Ico.msg2}</span> Messages from your doctor</h2>
                {doctorNotes.slice(0,5).map(n=>(
                  <div key={n.id} style={{padding:'14px 18px',background:n.sender==='patient'?'#00C48C08':'#3B82F608',borderRadius:14,marginBottom:10,borderLeft:'3px solid '+(n.sender==='patient'?C.green:C.blue)}}>
                    <div style={{fontSize:13.5,color:'#374151',lineHeight:1.75}}>{n.content}</div>
                    <div style={{fontSize:11.5,color:C.muted,marginTop:7,fontWeight:700}}>{n.sender==='patient'?'You':'Dr. '+n.doctor_name} · {n.created_at?.slice(0,16).replace('T',' ')}</div>
                  </div>
                ))}
                <div style={{display:'flex',gap:10,marginTop:14}}>
                  <input value={replyText} onChange={e=>setReplyText(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')sendReply()}}
                    placeholder='Write a message to your doctor...'
                    style={{flex:1,padding:'12px 16px',border:'2px solid '+C.border,borderRadius:12,fontSize:13.5,outline:'none',fontFamily:'inherit',background:'#FBFDFC'}}/>
                  <button onClick={sendReply} disabled={replySending||!replyText.trim()}
                    style={{padding:'12px 24px',background:replyText.trim()?'linear-gradient(135deg,#3B82F6,#2563EB)':'#E8EDF2',color:replyText.trim()?'#fff':'#9CA3AF',border:'none',borderRadius:12,fontSize:13.5,fontWeight:700,cursor:replyText.trim()?'pointer':'default',fontFamily:'inherit'}}>
                    {replySending?'Sending...':'Send'}
                  </button>
                </div>
              </div>
            )}

            {riskChartData.length>1 && (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24,gridColumn:'1/-1'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                  <h2 style={{fontSize:16,fontWeight:800,color:C.text,margin:0,display:'flex',alignItems:'center',gap:8}}><span style={{color:C.red}}>{Ico.target}</span> Risk History</h2>
                  <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{riskChartData.length} assessments</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={riskChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="time" tick={{fontSize:10.5,fill:C.muted}} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fontSize:10.5,fill:C.muted}} tickLine={false} axisLine={false} unit="%" width={45}/>
                    <Tooltip formatter={(v)=>[v+'%','Risk']} labelStyle={{color:'#1A2332'}}/>
                    <ReferenceLine y={70} stroke={C.red} strokeDasharray="4 4" label={{value:'Very High',fontSize:10,fill:C.red,position:'right'}}/>
                    <ReferenceLine y={30} stroke={C.green} strokeDasharray="4 4" label={{value:'Low',fontSize:10,fill:C.green,position:'right'}}/>
                    <Line type="monotone" dataKey="risk" stroke={C.red} strokeWidth={2.8} dot={{fill:C.red,r:4,strokeWidth:0}} activeDot={{r:6,strokeWidth:2,stroke:'#fff'}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartData.length>1 && (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24,gridColumn:'1/-1'}}>
                <h2 style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:18,display:'flex',alignItems:'center',gap:8}}><span style={{color:C.green}}>{Ico.up}</span> Glucose Trend</h2>
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="gGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.green} stopOpacity={0.25}/>
                        <stop offset="100%" stopColor={C.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="time" tick={{fontSize:10.5,fill:C.muted,fontFamily:F}} tickLine={false}/>
                    <YAxis domain={[2,30]} tick={{fontSize:10.5,fill:C.muted,fontFamily:F}} tickLine={false} axisLine={false} unit=" mmol" width={65}/>
                    <Tooltip content={<Tip/>}/>
                    <ReferenceLine y={10} stroke={C.red} strokeDasharray="4 4" label={{value:'High',fontSize:10,fill:C.red,position:'right'}}/>
                    <ReferenceLine y={3.9} stroke={C.yellow} strokeDasharray="4 4" label={{value:'Low',fontSize:10,fill:C.yellow,position:'right'}}/>
                    <Line type="monotone" dataKey="glucose" stroke={C.green} strokeWidth={2.8} dot={{fill:C.green,r:4,strokeWidth:0}} activeDot={{r:6,strokeWidth:2,stroke:'#fff'}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab==='log' && (
          <div style={{maxWidth:480}}>
            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:28}}>
              <h2 style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:6}}>Log a Reading</h2>
              <p style={{fontSize:13,color:C.muted,marginBottom:24,fontWeight:500}}>Enter your blood glucose from your glucometer</p>
              <form onSubmit={addReading}>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11.5,fontWeight:800,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.8px'}}>Glucose Level (mmol/L)</label>
                  <input type="number" step="0.1" min="2.5" max="30" required value={form.glucose_mmol}
                    onChange={e=>setForm({...form,glucose_mmol:e.target.value})} placeholder="e.g. 5.6"
                    style={{width:'100%',padding:'14px 16px',border:'2px solid '+C.border,borderRadius:14,fontSize:22,fontWeight:800,color:C.text,outline:'none',boxSizing:'border-box',fontFamily:F,background:'#FBFDFC'}}/>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11.5,fontWeight:800,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.8px'}}>Meal Context</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[['fasting','Fasting'],['pre_meal','Pre-meal'],['post_meal','Post-meal (2hr)'],['random','Random']].map(([v,l])=>(
                      <button key={v} type="button" onClick={()=>setForm({...form,meal_context:v})}
                        style={{padding:'11px',border:'2px solid '+(form.meal_context===v?C.green:C.border),borderRadius:12,background:form.meal_context===v?'#00C48C0D':'transparent',color:form.meal_context===v?'#00A878':C.muted,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:F,transition:'all 0.15s'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:24}}>
                  <label style={{display:'block',fontSize:11.5,fontWeight:800,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.8px'}}>Notes (optional)</label>
                  <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g. after breakfast"
                    style={{width:'100%',padding:'12px 16px',border:'2px solid '+C.border,borderRadius:12,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:F,background:'#FBFDFC'}}/>
                </div>
                <div style={{display:'flex',gap:8,marginBottom:14}}>
                  <button type="button" onClick={()=>fillDemo('normal')}
                    style={{flex:1,padding:'9px',background:'#00C48C0D',color:'#00A878',border:'1.5px dashed #00C48C60',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>
                    Fill normal sample
                  </button>
                  <button type="button" onClick={()=>fillDemo('high')}
                    style={{flex:1,padding:'9px',background:'#FF6B6B0D',color:'#DC2626',border:'1.5px dashed #FF6B6B60',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F}}>
                    Fill high sample
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  style={{width:'100%',padding:'15px',background:'linear-gradient(135deg,#00C48C,#00A878)',color:'#fff',border:'none',borderRadius:14,fontSize:15.5,fontWeight:800,cursor:'pointer',opacity:loading?0.7:1,fontFamily:F,boxShadow:'0 8px 20px rgba(0,196,140,0.35)'}}>
                  {loading?'Saving...':'Add Reading'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab==='history' && (
          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,overflow:'hidden'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid '+C.border}}>
              <h2 style={{fontSize:16,fontWeight:800,color:C.text,margin:0}}>Reading History <span style={{fontSize:12,color:C.muted,fontWeight:600}}>({readings.length} records)</span></h2>
            </div>
            {readings.length===0 ? (
              <div style={{textAlign:'center',padding:48,color:C.muted}}>
                <div style={{color:C.border,marginBottom:10,display:'flex',justifyContent:'center'}}>{Ico.msg}</div>
                <p style={{fontWeight:600}}>No readings yet. Go to Log Reading to start.</p>
              </div>
            ) : (
              <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',minWidth:isMobile?640:'auto',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFB'}}>
                    {['Date & Time','Glucose (mmol/L)','Meal Context','Notes','Status','Action'].map(h=>(
                      <th key={h} style={{padding:'12px 20px',textAlign:'left',fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.7px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r,i)=>{
                    const s = r.glucose_mmol>10?{l:'High',c:C.red}:r.glucose_mmol<3.9?{l:'Low',c:C.yellow}:{l:'Normal',c:C.green}
                    return (
                      <tr key={r.id} style={{borderTop:'1px solid '+C.border,background:i%2===0?'#fff':'#FBFCFD'}}>
                        <td style={{padding:'14px 20px',fontSize:13,color:C.text,fontWeight:500}}>{r.measured_at?.slice(0,16).replace('T',' ')}</td>
                        <td style={{padding:'14px 20px',fontSize:16,fontWeight:800,color:s.c}}>{r.glucose_mmol}</td>
                        <td style={{padding:'14px 20px',fontSize:13,color:C.muted,fontWeight:500}}>{r.meal_context.replace('_',' ')}</td>
                        <td style={{padding:'14px 20px',fontSize:13,color:C.muted}}>{r.notes||'—'}</td>
                        <td style={{padding:'14px 20px'}}><span style={{padding:'4px 12px',borderRadius:20,fontSize:11.5,fontWeight:800,background:s.c+'16',color:s.c}}>{s.l}</span></td>
                        <td style={{padding:'14px 20px'}}>
                          <button onClick={()=>deleteReading(r.id)}
                            style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',background:'transparent',color:C.red,border:'1.5px solid #FF6B6B50',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F,transition:'all 0.15s'}}
                            onMouseOver={e=>e.currentTarget.style.background='#FF6B6B10'}
                            onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                            {Ico.trash} Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

