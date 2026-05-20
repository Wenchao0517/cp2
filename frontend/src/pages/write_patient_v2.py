import os

content = r"""import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { patientAPI, predictAPI } from '../api/endpoints'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const C = {
  green:'#00C48C', red:'#FF6B6B', yellow:'#FFB020', blue:'#3B82F6',
  bg:'#F8FAFB', card:'#FFFFFF', border:'#E8EDF2', text:'#1A2332', muted:'#6B7A8F',
  low:'#00C48C', moderate:'#FFB020', high:'#FF6B6B', very_high:'#DC2626',
}

const IcoDrop = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
const IcoBar  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoClip = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
const IcoBulb = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
const IcoLine = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IcoList = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const IcoRef  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const IcoPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoShield = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoTarget = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const IcoChat  = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IcoWave  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const IcoUser  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>

const RiskGauge = ({ probability, risk_level }) => {
  const pct = Math.round((probability || 0) * 100)
  const color = C[risk_level] || C.blue
  const circ = 2 * Math.PI * 54
  const offset = circ - (pct / 100) * circ
  const label = (risk_level || '').replace('_', ' ').toUpperCase()
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0'}}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke={C.border} strokeWidth="10"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{transition:'stroke-dashoffset 0.8s ease'}}/>
        <text x="70" y="63" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{pct}%</text>
        <text x="70" y="82" textAnchor="middle" fontSize="11" fill={C.muted}>probability</text>
      </svg>
      <div style={{background:color,color:'#fff',padding:'5px 22px',borderRadius:20,fontWeight:700,fontSize:13,marginTop:4,letterSpacing:'0.5px'}}>{label}</div>
    </div>
  )
}

const StatCard = ({ label, value, unit, color, icon }) => (
  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'18px 20px',display:'flex',alignItems:'center',gap:14}}>
    <div style={{width:46,height:46,borderRadius:13,background:color+'1A',display:'flex',alignItems:'center',justifyContent:'center',color:color,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:22,fontWeight:700,color:C.text,lineHeight:1}}>{value}<span style={{fontSize:13,color:C.muted,marginLeft:4,fontWeight:400}}>{unit}</span></div>
      <div style={{fontSize:12,color:C.muted,marginTop:4}}>{label}</div>
    </div>
  </div>
)

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'#1A2332',borderRadius:10,padding:'8px 14px',color:'#fff',fontSize:13,boxShadow:'0 4px 12px rgba(0,0,0,0.2)'}}>
      <div style={{color:'#8B9BB4',fontSize:11,marginBottom:2}}>{payload[0]?.payload?.time}</div>
      <div style={{fontWeight:700,color:C.green}}>{payload[0].value} mmol/L</div>
    </div>
  )
}

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [readings, setReadings]     = useState([])
  const [assessment, setAssessment] = useState(null)
  const [form, setForm]             = useState({ glucose_mmol:'', meal_context:'fasting', notes:'' })
  const [msg, setMsg]               = useState({ text:'', type:'' })
  const [loading, setLoading]       = useState(false)
  const [tab, setTab]               = useState('overview')

  useEffect(() => {
    patientAPI.getGlucose().then(r => setReadings(r.data.readings))
    predictAPI.getLatest().then(r => setAssessment(r.data.assessment))
  }, [])

  const flash = (text, type='ok') => { setMsg({text,type}); setTimeout(() => setMsg({text:'',type:''}), 3500) }

  const addReading = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await patientAPI.addGlucose({...form, glucose_mmol:parseFloat(form.glucose_mmol), measured_at:new Date().toISOString()})
      const r = await patientAPI.getGlucose(); setReadings(r.data.readings)
      setForm({glucose_mmol:'', meal_context:'fasting', notes:''})
      flash('Reading logged successfully')
    } catch(e) { flash(e.response?.data?.error || 'Error', 'err') }
    setLoading(false)
  }

  const runAssessment = async () => {
    setLoading(true)
    try {
      const r = await predictAPI.runAssessment(); setAssessment(r.data.assessment); flash('Assessment updated')
    } catch(e) { flash(e.response?.data?.error || 'Failed', 'err') }
    setLoading(false)
  }

  const chartData = [...readings].reverse().map((r,i) => ({ name:'#'+(i+1), glucose:r.glucose_mmol, time:r.measured_at?.slice(5,16).replace('T',' ') }))
  const avg = readings.length ? (readings.reduce((s,r) => s+r.glucose_mmol, 0)/readings.length).toFixed(1) : '--'
  const tabs = [['overview','Overview',<IcoShield/>],['log','Log Reading',<IcoPlus/>],['history','History',<IcoList/>]]

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>

      <nav style={{background:C.card,borderBottom:'1px solid '+C.border,padding:'0 32px',height:62,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 0 '+C.border}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#00C48C,#00A070)',display:'flex',alignItems:'center',justifyContent:'center'}}><IcoWave/></div>
          <span style={{fontWeight:700,fontSize:17,color:C.text,letterSpacing:'-0.3px'}}>DiabetesGuard</span>
          <span style={{fontSize:11,background:'#00C48C18',color:C.green,padding:'2px 9px',borderRadius:20,fontWeight:600,marginLeft:2,letterSpacing:'0.3px'}}>PATIENT</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'#00C48C18',display:'flex',alignItems:'center',justifyContent:'center',color:C.green,fontWeight:700,fontSize:13}}>
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <span style={{fontSize:13,fontWeight:600,color:C.text,marginRight:4}}>{user?.full_name}</span>
          <button onClick={()=>navigate('/profile')}
            style={{padding:'6px 14px',background:C.green+'18',color:C.green,border:'1px solid '+C.green+'40',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            <IcoUser/>Edit Profile
          </button>
          <button onClick={logout}
            style={{padding:'6px 14px',background:'transparent',color:C.muted,border:'1px solid '+C.border,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>
            Sign out
          </button>
        </div>
      </nav>

      {msg.text && (
        <div style={{position:'fixed',top:72,right:24,zIndex:200,background:msg.type==='err'?C.red:C.green,color:'#fff',padding:'11px 18px',borderRadius:10,fontSize:13,fontWeight:600,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',display:'flex',alignItems:'center',gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {msg.type==='err' ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          {msg.text}
        </div>
      )}

      <div style={{maxWidth:1160,margin:'0 auto',padding:'26px 24px'}}>
        <div style={{marginBottom:22}}>
          <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:'0 0 3px',letterSpacing:'-0.4px'}}>Good day, {user?.full_name?.split(' ')[0]}</h1>
          <p style={{color:C.muted,fontSize:13,margin:0}}>Your personal diabetes risk monitor</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
          <StatCard label="Latest reading" value={readings[0]?.glucose_mmol ?? '--'} unit="mmol/L" color={C.green} icon={<IcoDrop/>}/>
          <StatCard label="7-day average"  value={avg} unit="mmol/L" color={C.blue} icon={<IcoBar/>}/>
          <StatCard label="Total readings" value={readings.length} unit="" color={C.yellow} icon={<IcoClip/>}/>
        </div>

        <div style={{display:'flex',gap:2,marginBottom:22,background:C.card,border:'1px solid '+C.border,borderRadius:11,padding:3,width:'fit-content'}}>
          {tabs.map(([k,l,ico]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{padding:'7px 18px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
                display:'flex',alignItems:'center',gap:6,
                background:tab===k ? C.green : 'transparent',
                color:tab===k ? '#fff' : C.muted,
                transition:'all 0.18s'}}>
              <span style={{opacity:0.85}}>{ico}</span>{l}
            </button>
          ))}
        </div>

        {tab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h2 style={{fontSize:15,fontWeight:700,color:C.text,margin:0}}>Risk Assessment</h2>
                <button onClick={runAssessment} disabled={loading}
                  style={{padding:'6px 14px',background:C.green,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',opacity:loading?0.65:1,display:'flex',alignItems:'center',gap:5}}>
                  <IcoRef/>{loading ? 'Updating...' : 'Update'}
                </button>
              </div>
              {assessment ? (
                <>
                  <RiskGauge probability={assessment.probability} risk_level={assessment.risk_level}/>
                  <div style={{marginTop:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.8px'}}>Top Contributing Factors</p>
                    {assessment.top_factors?.slice(0,3).map((f,i) => (
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid '+C.border}}>
                        <span style={{fontSize:13,color:C.text,fontWeight:500}}>{f.feature}</span>
                        <span style={{fontSize:11,fontWeight:700,
                          color:f.direction==='increase' ? C.red : C.green,
                          background:f.direction==='increase' ? '#FF6B6B14' : '#00C48C14',
                          padding:'3px 11px',borderRadius:20}}>
                          {f.direction==='increase' ? '▲ Risk factor' : '▼ Protective'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center',padding:'36px 0',color:C.muted}}>
                  <div style={{color:C.border,marginBottom:10}}><IcoTarget/></div>
                  <p style={{fontSize:14,fontWeight:600,color:C.text,margin:'0 0 4px'}}>No assessment yet</p>
                  <p style={{fontSize:12,margin:0}}>Add readings then click Update</p>
                </div>
              )}
            </div>

            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
              <h2 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:C.yellow}}><IcoBulb/></span> Recommendations
              </h2>
              {assessment?.recommendation ? (
                <div style={{fontSize:13,lineHeight:1.85,color:'#374151',background:'#F0FDF8',borderRadius:10,padding:16,borderLeft:'3px solid '+C.green}}>
                  {assessment.recommendation.split('\n').map((line,i) =>
                    line.trim() && <p key={i} style={{margin:'0 0 10px'}}>{line.replace(/\*\*/g,'')}</p>
                  )}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'36px 0',color:C.muted}}>
                  <div style={{color:C.border,marginBottom:10}}><IcoChat/></div>
                  <p style={{fontSize:14,fontWeight:600,color:C.text,margin:'0 0 4px'}}>No recommendations yet</p>
                  <p style={{fontSize:12,margin:0}}>Run an assessment to get personalised advice</p>
                </div>
              )}
            </div>

            {chartData.length > 1 && (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22,gridColumn:'1/-1'}}>
                <h2 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{color:C.green}}><IcoLine/></span> Glucose Trend
                </h2>
                <ResponsiveContainer width="100%" height={196}>
                  <LineChart data={chartData} margin={{top:4,right:16,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false}/>
                    <XAxis dataKey="time" tick={{fontSize:11,fill:C.muted}} tickLine={false} axisLine={false}/>
                    <YAxis domain={[2,16]} tick={{fontSize:11,fill:C.muted}} tickLine={false} axisLine={false} unit=" mmol" width={68}/>
                    <Tooltip content={<Tip/>}/>
                    <ReferenceLine y={7.8} stroke={C.yellow} strokeDasharray="5 3" strokeWidth={1.5}/>
                    <ReferenceLine y={3.9} stroke={C.red} strokeDasharray="5 3" strokeWidth={1.5}/>
                    <Line type="monotone" dataKey="glucose" stroke={C.green} strokeWidth={2.5} dot={{fill:C.green,r:4,strokeWidth:2,stroke:'#fff'}} activeDot={{r:6,stroke:C.green,strokeWidth:2,fill:'#fff'}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab==='log' && (
          <div style={{maxWidth:460}}>
            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:26}}>
              <h2 style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:5,letterSpacing:'-0.3px'}}>Log a Reading</h2>
              <p style={{fontSize:13,color:C.muted,marginBottom:22}}>Enter your blood glucose from your glucometer</p>
              <form onSubmit={addReading}>
                <div style={{marginBottom:18}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.7px'}}>Glucose Level (mmol/L)</label>
                  <input type="number" step="0.1" min="2.5" max="30" required
                    value={form.glucose_mmol} onChange={e => setForm({...form, glucose_mmol:e.target.value})}
                    placeholder="e.g. 5.6"
                    style={{width:'100%',padding:'13px 15px',border:'1.5px solid '+C.border,borderRadius:10,fontSize:20,fontWeight:700,color:C.text,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.7px'}}>Meal Context</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {[['fasting','Fasting'],['pre_meal','Pre-meal'],['post_meal','Post-meal (2hr)'],['random','Random']].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setForm({...form, meal_context:v})}
                        style={{padding:'10px 8px',border:'1.5px solid '+(form.meal_context===v ? C.green : C.border),
                          borderRadius:9,background:form.meal_context===v ? '#F0FDF8' : 'transparent',
                          color:form.meal_context===v ? C.green : C.muted,fontWeight:600,fontSize:13,cursor:'pointer',transition:'all 0.15s'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:22}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.7px'}}>Notes (optional)</label>
                  <input value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}
                    placeholder="e.g. after breakfast"
                    style={{width:'100%',padding:'11px 15px',border:'1.5px solid '+C.border,borderRadius:10,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>
                </div>
                <button type="submit" disabled={loading}
                  style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#00C48C,#00A070)',color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'inherit'}}>
                  <IcoPlus/>{loading ? 'Saving...' : 'Add Reading'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab==='history' && (
          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,overflow:'hidden'}}>
            <div style={{padding:'16px 22px',borderBottom:'1px solid '+C.border,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontSize:15,fontWeight:700,color:C.text,margin:0}}>Reading History</h2>
              <span style={{fontSize:12,color:C.muted,background:C.bg,padding:'3px 10px',borderRadius:20,border:'1px solid '+C.border}}>{readings.length} records</span>
            </div>
            {readings.length === 0 ? (
              <div style={{textAlign:'center',padding:'56px',color:C.muted}}>
                <p style={{fontSize:14,fontWeight:600,color:C.text,margin:'0 0 4px'}}>No readings yet</p>
                <p style={{fontSize:13,margin:0}}>Go to Log Reading to start tracking</p>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFB'}}>
                    {['Date & Time','Glucose (mmol/L)','Meal Context','Notes','Status'].map(h => (
                      <th key={h} style={{padding:'11px 20px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.6px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r,i) => {
                    const s = r.glucose_mmol>10?{l:'High',c:C.red}:r.glucose_mmol<3.9?{l:'Low',c:C.yellow}:{l:'Normal',c:C.green}
                    return (
                      <tr key={r.id} style={{borderTop:'1px solid '+C.border,background:i%2===0?'#fff':'#FCFCFD'}}>
                        <td style={{padding:'13px 20px',fontSize:13,color:C.text}}>{r.measured_at?.slice(0,16).replace('T',' ')}</td>
                        <td style={{padding:'13px 20px',fontSize:15,fontWeight:700,color:s.c}}>{r.glucose_mmol}</td>
                        <td style={{padding:'13px 20px',fontSize:13,color:C.muted}}>{r.meal_context.replace('_',' ')}</td>
                        <td style={{padding:'13px 20px',fontSize:13,color:C.muted}}>{r.notes || '--'}</td>
                        <td style={{padding:'13px 20px'}}>
                          <span style={{padding:'3px 11px',borderRadius:20,fontSize:11,fontWeight:700,background:s.c+'18',color:s.c,letterSpacing:'0.3px'}}>{s.l}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
"""

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'PatientDashboard.jsx')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('PatientDashboard.jsx written to:', path)
