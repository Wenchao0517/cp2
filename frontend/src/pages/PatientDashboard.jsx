import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { patientAPI, predictAPI } from '../api/endpoints'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const C = {
  green:'#00C48C', red:'#FF6B6B', yellow:'#FFB020', blue:'#3B82F6',
  bg:'#F8FAFB', card:'#FFFFFF', border:'#E8EDF2', text:'#1A2332', muted:'#6B7A8F',
  low:'#00C48C', moderate:'#FFB020', high:'#FF6B6B', very_high:'#DC2626',
}

const RiskGauge = ({ probability, risk_level }) => {
  const pct = Math.round((probability||0)*100)
  const color = C[risk_level] || C.blue
  const r = 54, circ = 2*Math.PI*r
  const offset = circ - (pct/100)*circ
  const label = (risk_level||'').replace('_',' ').toUpperCase()
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0'}}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke={C.border} strokeWidth="12"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{transition:'stroke-dashoffset 0.8s ease'}}/>
        <text x="70" y="63" textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>{pct}%</text>
        <text x="70" y="82" textAnchor="middle" fontSize="11" fill={C.muted}>probability</text>
      </svg>
      <div style={{background:color,color:'#fff',padding:'4px 20px',borderRadius:20,fontWeight:700,fontSize:14,marginTop:4}}>{label}</div>
    </div>
  )
}

const StatCard = ({ label, value, unit, color, icon }) => (
  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
    <div style={{width:44,height:44,borderRadius:12,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{icon}</div>
    <div>
      <div style={{fontSize:22,fontWeight:700,color:C.text}}>{value}<span style={{fontSize:13,color:C.muted,marginLeft:4}}>{unit}</span></div>
      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{label}</div>
    </div>
  </div>
)

const Tip = ({ active, payload }) => {
  if (!active||!payload?.length) return null
  return <div style={{background:'#1A2332',borderRadius:10,padding:'8px 14px',color:'#fff',fontSize:13}}><div style={{color:'#aaa'}}>{payload[0]?.payload?.time}</div><div style={{fontWeight:700,color:C.green}}>{payload[0].value} mmol/L</div></div>
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

  const flash = (text, type='ok') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3500) }

  const addReading = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await patientAPI.addGlucose({...form, glucose_mmol:parseFloat(form.glucose_mmol), measured_at:new Date().toISOString()})
      const r = await patientAPI.getGlucose(); setReadings(r.data.readings)
      setForm({glucose_mmol:'',meal_context:'fasting',notes:''})
      flash('Reading logged')
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
  const runAssessment = async () => {
    setLoading(true)
    try { const r = await predictAPI.runAssessment(); setAssessment(r.data.assessment); flash('Assessment updated') }
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

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'}}>
      <nav style={{background:C.card,borderBottom:'1px solid '+C.border,padding:'0 28px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#00C48C,#00A878)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🩺</div>
          <span style={{fontWeight:700,fontSize:18,color:C.text}}>DiabetesGuard</span>
          <span style={{fontSize:12,background:'#00C48C22',color:C.green,padding:'2px 8px',borderRadius:20,fontWeight:600,marginLeft:4}}>PATIENT</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'#00C48C22',display:'flex',alignItems:'center',justifyContent:'center',color:C.green,fontWeight:700}}>{user?.full_name?.[0]?.toUpperCase()}</div>
          <span style={{fontSize:14,fontWeight:600,color:C.text}}>{user?.full_name}</span>
          <button onClick={()=>navigate('/profile')} style={{padding:'7px 16px',background:'#3B82F608',color:'#3B82F6',border:'1px solid #3B82F6',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>✏ Edit Profile</button>
          <button onClick={logout} style={{padding:'7px 16px',background:'transparent',color:C.muted,border:'1px solid '+C.border,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Sign out</button>
        </div>
      </nav>

      {highReadings.length > 0 && (
        <div style={{background:'#FFF3F3',border:'1px solid #FF6B6B',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontWeight:700,color:'#DC2626',fontSize:14}}>High Blood Glucose Alert</div>
            <div style={{fontSize:13,color:'#6B7A8F'}}>{highReadings.length} reading(s) above 10 mmol/L in your history. Please consult your doctor.</div>
          </div>
        </div>
      )}
      {lowReadings.length > 0 && (
        <div style={{background:'#FFFBF0',border:'1px solid #FFB020',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontWeight:700,color:'#B45309',fontSize:14}}>Low Blood Glucose Alert</div>
            <div style={{fontSize:13,color:'#6B7A8F'}}>{lowReadings.length} reading(s) below 3.9 mmol/L detected. Risk of hypoglycemia.</div>
          </div>
        </div>
      )}
      {msg.text && <div style={{position:'fixed',top:76,right:24,zIndex:200,background:msg.type==='err'?C.red:C.green,color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:14,fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>{msg.type==='err'?'⚠ ':'✓ '}{msg.text}</div>}

      <div style={{maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:C.text,marginBottom:4}}>Good day, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p style={{color:C.muted,fontSize:14,margin:0}}>Your personal diabetes risk monitor</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28}}>
          <StatCard label="Latest reading" value={readings[0]?.glucose_mmol??'--'} unit="mmol/L" color={C.green} icon="💉"/>
          <StatCard label="7-day average" value={avg} unit="mmol/L" color={C.blue} icon="📊"/>
          <StatCard label="7-day Max" value={maxGlucose} unit="mmol/L" color={C.red} icon="📈"/>
          <StatCard label="7-day Min" value={minGlucose} unit="mmol/L" color={C.blue} icon="📉"/>
          <StatCard label="Est. HbA1c" value={hba1c} unit="%" color={C.yellow} icon="🧪"/>
          <StatCard label="Total readings" value={readings.length} unit="" color={C.yellow} icon="📋"/>
        </div>

        <div style={{display:'flex',gap:4,marginBottom:24,background:C.card,border:'1px solid '+C.border,borderRadius:12,padding:4,width:'fit-content'}}>
          {[['overview','📊 Overview'],['log','+ Log Reading'],['history','📋 History']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:'8px 20px',borderRadius:9,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,background:tab===k?C.green:'transparent',color:tab===k?'#fff':C.muted,transition:'all 0.2s'}}>{l}</button>
          ))}
        </div>

        {tab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:0}}>Risk Assessment</h2>
                <button onClick={runAssessment} disabled={loading} style={{padding:'7px 16px',background:C.green,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}>
                  {loading?'...':'↻ Update'}
                </button>
              </div>
              {assessment ? (
                <>
                  <RiskGauge probability={assessment.probability} risk_level={assessment.risk_level}/>
                  <div style={{marginTop:16}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>Top Contributing Factors</p>
                    {assessment.top_factors?.slice(0,3).map((f,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid '+C.border}}>
                        <span style={{fontSize:13,color:C.text}}>{f.feature}</span>
                        <span style={{fontSize:12,fontWeight:700,color:f.direction==='increase'?C.red:C.green,background:f.direction==='increase'?'#FF6B6B18':'#00C48C18',padding:'2px 10px',borderRadius:20}}>
                          {f.direction==='increase'?'▲ Risk factor':'▼ Protective'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center',padding:'32px 0',color:C.muted}}>
                  <div style={{fontSize:40,marginBottom:8}}>🎯</div>
                  <p style={{fontSize:14,margin:0}}>No assessment yet</p>
                  <p style={{fontSize:12,margin:'4px 0 0'}}>Add readings then click Update</p>
                </div>
              )}
            </div>

            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24}}>
              <h2 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>💡 Recommendations</h2>
              {assessment?.recommendation ? (
                <div style={{fontSize:13,lineHeight:1.8,color:'#374151',background:'#00C48C08',borderRadius:12,padding:16,borderLeft:'3px solid '+C.green}}>
                  {assessment.recommendation.split('\n').map((line,i)=>line.trim()&&<p key={i} style={{marginBottom:8,margin:'0 0 8px'}}>{line.replace(/\*\*/g,'')}</p>)}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px 0',color:C.muted}}>
                  <div style={{fontSize:40,marginBottom:8}}>💬</div>
                  <p style={{fontSize:14,margin:0}}>Run an assessment to get personalised advice</p>
                </div>
              )}
            </div>

            {chartData.length>1 && (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:24,gridColumn:'1/-1'}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>📈 Glucose Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="time" tick={{fontSize:11,fill:C.muted}} tickLine={false}/>
                    <YAxis domain={[2,16]} tick={{fontSize:11,fill:C.muted}} tickLine={false} axisLine={false} unit=" mmol/L" width={75}/>
                    <Tooltip content={<Tip/>}/>
                    <ReferenceLine y={7.8} stroke={C.yellow} strokeDasharray="4 4" label={{value:'High',fontSize:10,fill:C.yellow,position:'right'}}/>
                    <ReferenceLine y={3.9} stroke={C.red} strokeDasharray="4 4" label={{value:'Low',fontSize:10,fill:C.red,position:'right'}}/>
                    <Line type="monotone" dataKey="glucose" stroke={C.green} strokeWidth={2.5} dot={{fill:C.green,r:4,strokeWidth:0}} activeDot={{r:6}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab==='log' && (
          <div style={{maxWidth:480}}>
            <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,padding:28}}>
              <h2 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:6}}>Log a Reading</h2>
              <p style={{fontSize:13,color:C.muted,marginBottom:24}}>Enter your blood glucose from your glucometer</p>
              <form onSubmit={addReading}>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>Glucose Level (mmol/L)</label>
                  <input type="number" step="0.1" min="2.5" max="30" required value={form.glucose_mmol}
                    onChange={e=>setForm({...form,glucose_mmol:e.target.value})} placeholder="e.g. 5.6"
                    style={{width:'100%',padding:'14px 16px',border:'2px solid '+C.border,borderRadius:12,fontSize:20,fontWeight:700,color:C.text,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>Meal Context</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[['fasting','Fasting'],['pre_meal','Pre-meal'],['post_meal','Post-meal (2hr)'],['random','Random']].map(([v,l])=>(
                      <button key={v} type="button" onClick={()=>setForm({...form,meal_context:v})}
                        style={{padding:'10px',border:'2px solid '+(form.meal_context===v?C.green:C.border),borderRadius:10,background:form.meal_context===v?'#00C48C12':'transparent',color:form.meal_context===v?C.green:C.muted,fontWeight:600,fontSize:13,cursor:'pointer'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:24}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>Notes (optional)</label>
                  <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g. after breakfast"
                    style={{width:'100%',padding:'12px 16px',border:'2px solid '+C.border,borderRadius:12,fontSize:14,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <button type="submit" disabled={loading} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#00C48C,#00A878)',color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:700,cursor:'pointer',opacity:loading?0.7:1}}>
                  {loading?'Saving...':'+ Add Reading'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab==='history' && (
          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:20,overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid '+C.border}}>
              <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:0}}>Reading History ({readings.length} records)</h2>
            </div>
            {readings.length===0 ? (
              <div style={{textAlign:'center',padding:48,color:C.muted}}>
                <div style={{fontSize:40,marginBottom:8}}>📋</div>
                <p>No readings yet. Go to Log Reading to start.</p>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F8FAFB'}}>
                    {['Date & Time','Glucose (mmol/L)','Meal Context','Notes','Status','Action'].map(h=>(
                      <th key={h} style={{padding:'12px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r,i)=>{
                    const s = r.glucose_mmol>10?{l:'High',c:C.red}:r.glucose_mmol<3.9?{l:'Low',c:C.yellow}:{l:'Normal',c:C.green}
                    return (
                      <tr key={r.id} style={{borderTop:'1px solid '+C.border,background:i%2===0?'#fff':'#FAFBFC'}}>
                        <td style={{padding:'14px 20px',fontSize:13,color:C.text}}>{r.measured_at?.slice(0,16).replace('T',' ')}</td>
                        <td style={{padding:'14px 20px',fontSize:16,fontWeight:700,color:s.c}}>{r.glucose_mmol}</td>
                        <td style={{padding:'14px 20px',fontSize:13,color:C.muted}}>{r.meal_context.replace('_',' ')}</td>
                        <td style={{padding:'14px 20px',fontSize:13,color:C.muted}}>{r.notes||'—'}</td>
                        <td style={{padding:'14px 20px'}}><span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,background:s.c+'18',color:s.c}}>{s.l}</span></td>
                        <td style={{padding:'14px 20px'}}><button onClick={()=>deleteReading(r.id)} style={{padding:'4px 12px',background:'#FF6B6B18',color:'#FF6B6B',border:'1px solid #FF6B6B',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>Delete</button></td>
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








