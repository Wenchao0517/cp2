import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { patientAPI, predictAPI } from '../api/endpoints'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const [readings, setReadings]     = useState([])
  const [assessment, setAssessment] = useState(null)
  const [form, setForm]             = useState({ glucose_mmol:'', meal_context:'fasting', notes:'' })
  const [msg, setMsg]               = useState('')
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    patientAPI.getGlucose().then(r => setReadings(r.data.readings))
    predictAPI.getLatest().then(r => setAssessment(r.data.assessment))
  }, [])

  const addReading = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await patientAPI.addGlucose({ ...form, glucose_mmol: parseFloat(form.glucose_mmol), measured_at: new Date().toISOString() })
      const r = await patientAPI.getGlucose()
      setReadings(r.data.readings)
      setForm({ glucose_mmol:'', meal_context:'fasting', notes:'' })
      setMsg('Reading added!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error adding reading')
    }
    setLoading(false)
  }

  const runAssessment = async () => {
    setLoading(true)
    try {
      const r = await predictAPI.runAssessment()
      setAssessment(r.data.assessment)
      setMsg('Risk assessment updated!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Assessment failed')
    }
    setLoading(false)
  }

  const riskColor = { low:'#48bb78', moderate:'#ed8936', high:'#f56565', very_high:'#c53030' }
  const chartData = [...readings].reverse().map(r => ({ time: r.measured_at?.slice(11,16), glucose: r.glucose_mmol }))

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}><span style={{fontSize:24}}>🩺</span><strong style={{marginLeft:8}}>DiabetesGuard</strong></div>
        <div style={styles.headerRight}>
          <span style={{marginRight:16, color:'#4a5568'}}>👤 {user?.full_name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {msg && <div style={styles.msg}>{msg}</div>}

        <div style={styles.grid}>
          {/* Risk Assessment Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🎯 Current Risk Level</h2>
            {assessment ? (
              <>
                <div style={{...styles.riskBadge, background: riskColor[assessment.risk_level] || '#718096'}}>
                  {assessment.risk_level?.replace('_',' ').toUpperCase()}
                </div>
                <p style={styles.prob}>Probability: {(assessment.probability * 100).toFixed(1)}%</p>
                {assessment.top_factors && (
                  <div style={{marginTop:12}}>
                    <p style={styles.sectionLabel}>Top contributing factors:</p>
                    {assessment.top_factors.slice(0,3).map((f,i) => (
                      <div key={i} style={styles.factor}>
                        <span>{f.feature}</span>
                        <span style={{color: f.direction==='increase'?'#f56565':'#48bb78', fontWeight:600}}>
                          {f.direction==='increase'?'▲':'▼'} {Math.abs(f.impact).toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {assessment.recommendation && (
                  <div style={styles.rec}>
                    <p style={styles.sectionLabel}>💡 Recommendation:</p>
                    <p style={{fontSize:13, lineHeight:1.6, color:'#4a5568'}}>{assessment.recommendation}</p>
                  </div>
                )}
              </>
            ) : <p style={{color:'#718096', marginTop:12}}>No assessment yet. Add readings then click Run Assessment.</p>}
            <button onClick={runAssessment} disabled={loading} style={styles.assessBtn}>
              {loading ? 'Running...' : '🔄 Run Risk Assessment'}
            </button>
          </div>

          {/* Add Reading Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📊 Log Glucose Reading</h2>
            <form onSubmit={addReading}>
              <div style={styles.field}>
                <label style={styles.label}>Glucose (mmol/L)</label>
                <input style={styles.input} type="number" step="0.1" min="2.5" max="30"
                  value={form.glucose_mmol} onChange={e => setForm({...form, glucose_mmol: e.target.value})} required placeholder="e.g. 5.6"/>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Meal Context</label>
                <select style={styles.input} value={form.meal_context} onChange={e => setForm({...form, meal_context: e.target.value})}>
                  <option value="fasting">Fasting</option>
                  <option value="pre_meal">Pre-meal</option>
                  <option value="post_meal">Post-meal (2hr)</option>
                  <option value="random">Random</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Notes (optional)</label>
                <input style={styles.input} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. after breakfast"/>
              </div>
              <button type="submit" disabled={loading} style={styles.submitBtn}>+ Add Reading</button>
            </form>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📈 Glucose Trend (last {readings.length} readings)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[2, 16]} unit=" mmol/L" width={80}/>
                <Tooltip formatter={(v) => [v + ' mmol/L', 'Glucose']}/>
                <Line type="monotone" dataKey="glucose" stroke="#667eea" strokeWidth={2} dot={{r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reading history */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Recent Readings</h2>
          {readings.length === 0 ? <p style={{color:'#718096'}}>No readings yet.</p> : (
            <table style={styles.table}>
              <thead><tr>{['Date/Time','Glucose (mmol/L)','Context','Notes'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
              <tbody>{readings.map(r => (
                <tr key={r.id}>
                  <td style={styles.td}>{r.measured_at?.slice(0,16).replace('T',' ')}</td>
                  <td style={{...styles.td, fontWeight:700, color: r.glucose_mmol > 10 ? '#f56565' : r.glucose_mmol > 7 ? '#ed8936' : '#48bb78'}}>{r.glucose_mmol}</td>
                  <td style={styles.td}>{r.meal_context}</td>
                  <td style={styles.td}>{r.notes || '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

const styles = {
  page:       { minHeight:'100vh', background:'#f0f4f8' },
  header:     { background:'#fff', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  headerLeft: { display:'flex', alignItems:'center', fontSize:18, fontWeight:700, color:'#2d3748' },
  headerRight:{ display:'flex', alignItems:'center' },
  logoutBtn:  { padding:'6px 16px', background:'#f56565', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:14 },
  main:       { maxWidth:1100, margin:'0 auto', padding:'24px 16px' },
  msg:        { background:'#c6f6d5', color:'#276749', padding:'10px 16px', borderRadius:8, marginBottom:16, fontWeight:600 },
  grid:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 },
  card:       { background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:20 },
  cardTitle:  { fontSize:17, fontWeight:700, color:'#2d3748', marginBottom:14 },
  riskBadge:  { display:'inline-block', padding:'8px 20px', borderRadius:20, color:'#fff', fontWeight:700, fontSize:18, marginBottom:8 },
  prob:       { fontSize:14, color:'#718096' },
  sectionLabel:{ fontSize:13, fontWeight:700, color:'#4a5568', marginBottom:6 },
  factor:     { display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #f0f4f8', fontSize:13 },
  rec:        { background:'#ebf8ff', borderRadius:8, padding:12, marginTop:12 },
  assessBtn:  { width:'100%', marginTop:16, padding:'10px', background:'#667eea', color:'#fff', border:'none', borderRadius:8, fontWeight:600 },
  field:      { marginBottom:12 },
  label:      { display:'block', marginBottom:4, fontSize:13, fontWeight:600, color:'#4a5568' },
  input:      { width:'100%', padding:'9px 12px', border:'2px solid #e2e8f0', borderRadius:8, fontSize:14 },
  submitBtn:  { width:'100%', padding:'10px', background:'#48bb78', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:15 },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:14 },
  th:         { textAlign:'left', padding:'8px 12px', background:'#f7fafc', color:'#4a5568', fontWeight:600, borderBottom:'2px solid #e2e8f0' },
  td:         { padding:'8px 12px', borderBottom:'1px solid #f0f4f8', color:'#4a5568' },
}
