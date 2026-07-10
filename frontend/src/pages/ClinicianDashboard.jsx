import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { clinicianAPI } from '../api/endpoints'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const C = {
  green:'#00C48C', red:'#FF6B6B', yellow:'#FFB020', blue:'#3B82F6',
  bg:'#F8FAFB', card:'#FFFFFF', border:'#E8EDF2', text:'#1A2332', muted:'#6B7A8F',
  low:'#00C48C', moderate:'#FFB020', high:'#FF6B6B', very_high:'#DC2626',
}

const IcoWave   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const IcoUsers  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoCheck  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoWarn   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoAlert  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const IcoSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoBulb   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
const IcoClick  = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>

const riskColor = (level) => C[level] || C.muted
const riskLabel = (level) => (level || 'unassessed').replace('_',' ').toUpperCase()

const RiskBadge = ({ level }) => (
  <span style={{padding:'3px 12px',borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:'0.3px',
    background:riskColor(level)+'18', color:riskColor(level)}}>
    {riskLabel(level)}
  </span>
)

const StatCard = ({ label, value, color, icon, sub }) => (
  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:'20px 22px',transition:'transform 0.15s, box-shadow 0.15s'}}
    onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 24px rgba(26,35,50,0.07)'}}
    onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
      <div style={{width:42,height:42,borderRadius:11,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',color:color}}>{icon}</div>
    </div>
    <div style={{fontSize:30,fontWeight:800,color:color,lineHeight:1}}>{value}</div>
    <div style={{fontSize:13,fontWeight:600,color:C.text,marginTop:4}}>{label}</div>
    {sub && <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}
  </div>
)

const GlucoseTip = ({ active, payload }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{background:'#1A2332',borderRadius:10,padding:'8px 14px',color:'#fff',fontSize:13}}>
      <div style={{color:'#aaa',fontSize:11}}>{payload[0]?.payload?.time}</div>
      <div style={{fontWeight:700,color:C.green}}>{payload[0].value} mmol/L</div>
    </div>
  )
}

export default function ClinicianDashboard() {
  const { user, logout } = useAuth()
  const [patients, setPatients] = useState([])
  const [stats, setStats]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [filter, setFilter]     = useState('')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [detailTab, setDetailTab] = useState('overview')
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  useEffect(() => {
    clinicianAPI.getPatients().then(r => setPatients(r.data.patients))
    clinicianAPI.getStats().then(r => setStats(r.data))
  }, [])

  const viewPatient = async (id) => {
    if (selected === id) { setSelected(null); setDetail(null); return }
    setLoading(true); setSelected(id); setDetailTab('overview')
    const r = await clinicianAPI.getPatientDetail(id)
    setDetail(r.data); setLoading(false)
    clinicianAPI.getPatientNotes(id).then(res => setNotes(res.data.notes)).catch(()=>setNotes([]))
  }

  const filtered = patients.filter(p => {
    const matchRisk   = !filter || p.latest_risk?.risk_level === filter
    const matchSearch = !search ||
      p.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(search.toLowerCase())
    return matchRisk && matchSearch
  })

  const d = stats?.risk_distribution || {}
  const highCount = (d.high||0) + (d.very_high||0)

  const submitNote = async () => {
    if (!noteText.trim()) return
    setNoteSaving(true)
    try {
      const r = await clinicianAPI.addNote(selected, noteText.trim())
      setNotes([r.data.note, ...notes])
      setNoteText('')
    } catch(e) { alert('Failed to save note') }
    setNoteSaving(false)
  }

  const chartData = detail?.readings
    ? [...detail.readings].reverse().map((r,i) => ({
        name: '#'+(i+1),
        glucose: r.glucose_mmol,
        time: r.measured_at?.slice(5,16).replace('T',' ')
      }))
    : []

  const avgGlucose = detail?.readings?.length
    ? (detail.readings.reduce((s,r)=>s+r.glucose_mmol,0)/detail.readings.length).toFixed(1)
    : '--'
  const maxGlucose = detail?.readings?.length
    ? Math.max(...detail.readings.map(r=>r.glucose_mmol))
    : '--'
  const highAlerts = detail?.readings?.filter(r=>r.glucose_mmol>10).length || 0

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif"}}>

      <nav style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid '+C.border,padding:'0 32px',height:62,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 0 '+C.border}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#3B82F6,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center'}}><IcoWave/></div>
          <span style={{fontWeight:800,fontSize:17,color:C.text,letterSpacing:'-0.4px'}}>DiabetesGuard</span>
          <span style={{fontSize:11,background:'#3B82F618',color:C.blue,padding:'2px 9px',borderRadius:20,fontWeight:600,marginLeft:2,letterSpacing:'0.3px'}}>CLINICIAN</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'#3B82F618',display:'flex',alignItems:'center',justifyContent:'center',color:C.blue,fontWeight:700,fontSize:13}}>
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>Dr. {user?.full_name}</div>
            <div style={{fontSize:11,color:C.muted}}>Clinician</div>
          </div>
          <button onClick={logout} style={{padding:'6px 14px',background:'transparent',color:C.muted,border:'1px solid '+C.border,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',marginLeft:6}}>Sign out</button>
        </div>
      </nav>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'26px 24px'}}>
        <div style={{marginBottom:22}}>
          <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:'0 0 3px',letterSpacing:'-0.4px'}}>Clinician Dashboard</h1>
          <p style={{color:C.muted,fontSize:13,margin:0}}>Monitor and manage your patient panel</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
          <StatCard label="Total Patients"   value={stats?.total_patients??0} color={C.blue}   icon={<IcoUsers/>}  sub="In your panel"/>
          <StatCard label="Low Risk"         value={d.low??0}                 color={C.green}  icon={<IcoCheck/>}  sub="Well managed"/>
          <StatCard label="Moderate Risk"    value={d.moderate??0}            color={C.yellow} icon={<IcoWarn/>}   sub="Monitor closely"/>
          <StatCard label="High / Very High" value={highCount}                color={C.red}    icon={<IcoAlert/>}  sub="Needs attention"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:18}}>

          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,overflow:'hidden'}}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid '+C.border}}>
              <h2 style={{fontSize:14,fontWeight:700,color:C.text,margin:'0 0 10px'}}>Patient Panel</h2>
              <div style={{position:'relative',marginBottom:8}}>
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.muted}}><IcoSearch/></span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients..."
                  style={{width:'100%',padding:'7px 10px 7px 28px',border:'1px solid '+C.border,borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {[['','All'],['low','Low'],['moderate','Mod'],['high','High'],['very_high','V.High']].map(([v,l])=>(
                  <button key={v} onClick={()=>setFilter(v)}
                    style={{padding:'3px 10px',border:'1px solid '+(filter===v?(riskColor(v)||C.blue):C.border),borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',
                      background:filter===v?(riskColor(v)||C.blue)+'18':'transparent',
                      color:filter===v?(riskColor(v)||C.blue):C.muted}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{maxHeight:'calc(100vh - 340px)',overflowY:'auto'}}>
              {filtered.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px',color:C.muted}}>
                  <p style={{fontSize:13,margin:0}}>No patients found</p>
                </div>
              ) : filtered.map(p => (
                <div key={p.patient?.id} onClick={()=>viewPatient(p.patient?.id)}
                  style={{padding:'12px 18px',borderBottom:'1px solid '+C.border,cursor:'pointer',transition:'all 0.15s',
                    background:selected===p.patient?.id?'#3B82F606':'#fff',
                    borderLeft:selected===p.patient?.id?'3px solid '+C.blue:'3px solid transparent'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:riskColor(p.latest_risk?.risk_level)+'20',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:riskColor(p.latest_risk?.risk_level),fontSize:13,flexShrink:0}}>
                        {p.user?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:C.text}}>{p.user?.full_name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:1}}>{p.user?.email}</div>
                      </div>
                    </div>
                    <RiskBadge level={p.latest_risk?.risk_level}/>
                  </div>
                  {p.latest_risk && (
                    <div style={{marginTop:6,fontSize:11,color:C.muted,paddingLeft:44}}>
                      Probability: <strong style={{color:riskColor(p.latest_risk.risk_level)}}>{Math.round(p.latest_risk.probability*100)}%</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            {!selected ? (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:'56px 40px',textAlign:'center',color:C.muted}}>
                <div style={{color:C.border,marginBottom:12,display:'flex',justifyContent:'center'}}><IcoClick/></div>
                <h3 style={{fontSize:17,fontWeight:600,color:C.text,margin:'0 0 6px'}}>Select a patient</h3>
                <p style={{fontSize:13,margin:0}}>Click any patient on the left to view their full profile and health data</p>
              </div>
            ) : loading ? (
              <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:'56px 40px',textAlign:'center',color:C.muted}}>
                <p style={{fontSize:14}}>Loading patient data...</p>
              </div>
            ) : detail && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>

                <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:14}}>
                      <div style={{width:52,height:52,borderRadius:'50%',background:'#3B82F618',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:C.blue}}>
                        {detail.user?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{fontSize:19,fontWeight:700,color:C.text,margin:0}}>{detail.user?.full_name}</h2>
                        <p style={{fontSize:13,color:C.muted,margin:'3px 0 0'}}>{detail.user?.email}</p>
                      </div>
                    </div>
                    {detail.assessments?.[0] && (
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>Latest Risk</div>
                        <RiskBadge level={detail.assessments[0].risk_level}/>
                        <div style={{fontSize:12,color:C.muted,marginTop:4}}>{Math.round(detail.assessments[0].probability*100)}% probability</div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{display:'flex',gap:4,background:C.card,border:'1px solid '+C.border,borderRadius:12,padding:4,width:'fit-content'}}>
                  {[['overview','Overview'],['chart','Glucose Chart'],['readings','Readings'],['notes','Notes']].map(([k,l])=>(
                    <button key={k} onClick={()=>setDetailTab(k)}
                      style={{padding:'7px 16px',borderRadius:9,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
                        background:detailTab===k?C.blue:'transparent',color:detailTab===k?'#fff':C.muted,transition:'all 0.2s'}}>
                      {l}
                    </button>
                  ))}
                </div>

                {detailTab==='overview' && detail.assessments?.[0]?.recommendation && (
                  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
                    <h3 style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12,display:'flex',alignItems:'center',gap:7}}>
                      <span style={{color:C.yellow}}><IcoBulb/></span> Latest AI Recommendation
                    </h3>
                    <div style={{fontSize:13,lineHeight:1.85,color:'#374151',background:'#F0FDF8',borderRadius:10,padding:16,borderLeft:'3px solid '+C.green}}>
                      {detail.assessments[0].recommendation.split('\n').map((line,i) =>
                        line.trim() && <p key={i} style={{margin:'0 0 8px'}}>{line.replace(/\*\*/g,'')}</p>
                      )}
                    </div>
                  </div>
                )}

                {detailTab==='chart' && (
                  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <h3 style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>📈 Glucose Trend</h3>
                      <div style={{display:'flex',gap:16,fontSize:12,color:C.muted}}>
                        <span>Avg: <strong style={{color:C.blue}}>{avgGlucose} mmol/L</strong></span>
                        <span>Max: <strong style={{color:C.red}}>{maxGlucose} mmol/L</strong></span>
                        <span>High alerts: <strong style={{color:C.red}}>{highAlerts}</strong></span>
                      </div>
                    </div>
                    {chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                          <XAxis dataKey="time" tick={{fontSize:10,fill:C.muted}} tickLine={false}/>
                          <YAxis domain={[2,30]} tick={{fontSize:10,fill:C.muted}} tickLine={false} axisLine={false} unit=" mmol" width={60}/>
                          <Tooltip content={<GlucoseTip/>}/>
                          <ReferenceLine y={10} stroke={C.red} strokeDasharray="4 4" label={{value:'High',fontSize:10,fill:C.red,position:'right'}}/>
                          <ReferenceLine y={3.9} stroke={C.yellow} strokeDasharray="4 4" label={{value:'Low',fontSize:10,fill:C.yellow,position:'right'}}/>
                          <Line type="monotone" dataKey="glucose" stroke={C.blue} strokeWidth={2.5} dot={{fill:C.blue,r:3,strokeWidth:0}} activeDot={{r:6}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{textAlign:'center',padding:'40px 0',color:C.muted,fontSize:13}}>Not enough data for chart</div>
                    )}
                  </div>
                )}

                {detailTab==='notes' && (
                  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
                    <h3 style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:14}}>Clinical Notes</h3>
                    <div style={{marginBottom:18}}>
                      <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                        placeholder='Write a note or recommendation for this patient...'
                        rows={3}
                        style={{width:'100%',padding:'12px 14px',border:'2px solid '+C.border,borderRadius:12,fontSize:13.5,outline:'none',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',background:'#FBFDFC'}}/>
                      <button onClick={submitNote} disabled={noteSaving||!noteText.trim()}
                        style={{marginTop:10,padding:'9px 22px',background:noteText.trim()?'linear-gradient(135deg,#3B82F6,#2563EB)':'#E8EDF2',color:noteText.trim()?'#fff':'#9CA3AF',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:noteText.trim()?'pointer':'default',fontFamily:'inherit'}}>
                        {noteSaving?'Saving...':'Send to Patient'}
                      </button>
                    </div>
                    {notes.length===0 ? (
                      <p style={{fontSize:13,color:C.muted,textAlign:'center',padding:'16px 0'}}>No notes yet. Write the first one above.</p>
                    ) : notes.map(n=>(
                      <div key={n.id} style={{padding:'13px 16px',background:'#F8FAFB',borderRadius:12,marginBottom:10,borderLeft:'3px solid '+C.blue}}>
                        <div style={{fontSize:13.5,color:'#374151',lineHeight:1.7}}>{n.content}</div>
                        <div style={{fontSize:11.5,color:C.muted,marginTop:6,fontWeight:600}}>Dr. {n.doctor_name} · {n.created_at?.slice(0,16).replace('T',' ')}</div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab==='readings' && (
                  <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,overflow:'hidden'}}>
                    <div style={{padding:'14px 22px',borderBottom:'1px solid '+C.border,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <h3 style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>Glucose Readings</h3>
                      <span style={{fontSize:11,color:C.muted,background:C.bg,padding:'2px 10px',borderRadius:20,border:'1px solid '+C.border}}>{detail.readings?.length||0} records</span>
                    </div>
                    {!detail.readings?.length ? (
                      <div style={{padding:32,textAlign:'center',color:C.muted,fontSize:13}}>No readings recorded yet</div>
                    ) : (
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead>
                          <tr style={{background:'#F8FAFB'}}>
                            {['Date & Time','Glucose','Context','Status'].map(h=>(
                              <th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.6px'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detail.readings.map((r,i)=>{
                            const s = r.glucose_mmol>10?{l:'High',c:C.red}:r.glucose_mmol<3.9?{l:'Low',c:C.yellow}:{l:'Normal',c:C.green}
                            return (
                              <tr key={r.id} style={{borderTop:'1px solid '+C.border,background:i%2===0?'#fff':'#FCFCFD'}}>
                                <td style={{padding:'12px 20px',fontSize:13,color:C.text}}>{r.measured_at?.slice(0,16).replace('T',' ')}</td>
                                <td style={{padding:'12px 20px',fontSize:15,fontWeight:700,color:s.c}}>{r.glucose_mmol} <span style={{fontSize:11,fontWeight:400,color:C.muted}}>mmol/L</span></td>
                                <td style={{padding:'12px 20px',fontSize:13,color:C.muted}}>{r.meal_context?.replace('_',' ')}</td>
                                <td style={{padding:'12px 20px'}}><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:s.c+'18',color:s.c}}>{s.l}</span></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}








