import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { clinicianAPI } from '../api/endpoints'

export default function ClinicianDashboard() {
  const { user, logout } = useAuth()
  const [patients, setPatients] = useState([])
  const [stats, setStats]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [filter, setFilter]     = useState('')

  useEffect(() => {
    clinicianAPI.getPatients().then(r => setPatients(r.data.patients))
    clinicianAPI.getStats().then(r => setStats(r.data))
  }, [])

  const viewPatient = async (id) => {
    setSelected(id)
    const r = await clinicianAPI.getPatientDetail(id)
    setDetail(r.data)
  }

  const filtered = filter ? patients.filter(p => p.latest_risk?.risk_level === filter) : patients
  const riskColor = { low:'#48bb78', moderate:'#ed8936', high:'#f56565', very_high:'#c53030' }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}><span style={{fontSize:24}}>🩺</span><strong style={{marginLeft:8}}>DiabetesGuard — Clinician</strong></div>
        <div style={styles.headerRight}>
          <span style={{marginRight:16, color:'#4a5568'}}>Dr. {user?.full_name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {stats && (
          <div style={styles.statsRow}>
            {[['Total Patients', stats.total_patients, '#667eea'],
              ['Low Risk', stats.risk_distribution?.low, '#48bb78'],
              ['Moderate', stats.risk_distribution?.moderate, '#ed8936'],
              ['High / Very High', (stats.risk_distribution?.high||0)+(stats.risk_distribution?.very_high||0), '#f56565'],
            ].map(([label, val, color]) => (
              <div key={label} style={{...styles.statCard, borderTop: '4px solid '+color}}>
                <div style={{fontSize:28, fontWeight:700, color}}>{val ?? 0}</div>
                <div style={{fontSize:13, color:'#718096'}}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <h2 style={styles.cardTitle}>👥 Patient Panel</h2>
              <select style={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All patients</option>
                <option value="low">Low risk</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <p style={{color:'#718096'}}>No patients assigned yet.</p>
            ) : filtered.map(p => (
              <div key={p.patient?.id} onClick={() => viewPatient(p.patient?.id)}
                style={{...styles.patientRow, background: selected===p.patient?.id ? '#ebf8ff' : '#fff'}}>
                <div>
                  <div style={{fontWeight:600}}>{p.user?.full_name}</div>
                  <div style={{fontSize:12, color:'#718096'}}>{p.user?.email}</div>
                </div>
                <div style={{...styles.riskPill, background: riskColor[p.latest_risk?.risk_level] || '#cbd5e0'}}>
                  {p.latest_risk?.risk_level?.replace('_',' ') || 'unassessed'}
                </div>
              </div>
            ))}
          </div>

          {detail && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📋 {detail.user?.full_name}</h2>
              <p style={{fontSize:13, color:'#718096', marginBottom:12}}>{detail.user?.email}</p>
              {detail.assessments?.[0] && (
                <div style={{...styles.rec, marginBottom:16}}>
                  <strong>Latest risk: </strong>
                  <span style={{color: riskColor[detail.assessments[0].risk_level], fontWeight:700}}>
                    {detail.assessments[0].risk_level?.replace('_',' ').toUpperCase()}
                  </span>
                  <span style={{color:'#718096', marginLeft:8}}>({(detail.assessments[0].probability*100).toFixed(1)}%)</span>
                  {detail.assessments[0].recommendation && (
                    <p style={{fontSize:12, marginTop:8, color:'#4a5568'}}>{detail.assessments[0].recommendation}</p>
                  )}
                </div>
              )}
              <h3 style={{fontSize:14, fontWeight:700, marginBottom:8}}>Recent Glucose Readings</h3>
              <table style={styles.table}>
                <thead><tr>{['Date','mmol/L','Context'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>{(detail.readings||[]).slice(0,10).map(r=>(
                  <tr key={r.id}>
                    <td style={styles.td}>{r.measured_at?.slice(0,16).replace('T',' ')}</td>
                    <td style={{...styles.td, fontWeight:700, color: r.glucose_mmol>10?'#f56565':r.glucose_mmol>7?'#ed8936':'#48bb78'}}>{r.glucose_mmol}</td>
                    <td style={styles.td}>{r.meal_context}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const styles = {
  page:        { minHeight:'100vh', background:'#f0f4f8' },
  header:      { background:'#fff', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  headerLeft:  { display:'flex', alignItems:'center', fontSize:18, fontWeight:700, color:'#2d3748' },
  headerRight: { display:'flex', alignItems:'center' },
  logoutBtn:   { padding:'6px 16px', background:'#f56565', color:'#fff', border:'none', borderRadius:8, fontWeight:600 },
  main:        { maxWidth:1200, margin:'0 auto', padding:'24px 16px' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
  statCard:    { background:'#fff', borderRadius:12, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', textAlign:'center' },
  grid:        { display:'grid', gridTemplateColumns:'380px 1fr', gap:20 },
  card:        { background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' },
  cardTitle:   { fontSize:17, fontWeight:700, color:'#2d3748' },
  filterSelect:{ padding:'6px 10px', border:'2px solid #e2e8f0', borderRadius:8, fontSize:13 },
  patientRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:8, marginBottom:8, cursor:'pointer', border:'1px solid #e2e8f0' },
  riskPill:    { padding:'3px 12px', borderRadius:12, color:'#fff', fontSize:12, fontWeight:700 },
  rec:         { background:'#f7fafc', borderRadius:8, padding:12, fontSize:13 },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:          { textAlign:'left', padding:'6px 10px', background:'#f7fafc', fontWeight:600, color:'#4a5568', borderBottom:'2px solid #e2e8f0' },
  td:          { padding:'6px 10px', borderBottom:'1px solid #f0f4f8', color:'#4a5568' },
}
