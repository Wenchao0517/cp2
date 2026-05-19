import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Disclaimer() {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, acceptConsent } = useAuth()
  const navigate = useNavigate()

  const handleAccept = async () => {
    setLoading(true)
    await acceptConsent()
    navigate(user?.role === 'doctor' ? '/clinician' : '/dashboard')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <h1 style={styles.title}>Important Disclaimer</h1>
        <div style={styles.box}>
          <p style={styles.p}><strong>This platform is a screening tool only — NOT a medical diagnostic device.</strong></p>
          <p style={styles.p}>DiabetesGuard uses machine learning to estimate your diabetes risk based on health indicators. The results are for <strong>educational and awareness purposes only</strong>.</p>
          <p style={styles.p}>⚠️ This system does <strong>NOT</strong> provide medical diagnosis, treatment plans, or clinical advice.</p>
          <p style={styles.p}>⚠️ Risk scores are derived from population-level data and may not reflect your individual clinical status.</p>
          <p style={styles.p}>✅ Always consult a qualified healthcare professional before making any health decisions.</p>
          <p style={styles.p}>✅ If you experience symptoms of diabetes, seek immediate medical attention.</p>
          <p style={styles.p} style={{fontSize:12, color:'#718096'}}>By continuing, you acknowledge that this tool is not a substitute for professional medical advice, diagnosis, or treatment. Your data is stored securely in compliance with Malaysian PDPA 2010.</p>
        </div>
        <label style={styles.checkRow}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{marginRight:10, width:18, height:18}}/>
          <span style={{fontSize:14}}>I have read and understood this disclaimer. I agree to use this platform for informational purposes only.</span>
        </label>
        <button
          style={{...styles.btn, opacity: (!agreed || loading) ? 0.5 : 1}}
          onClick={handleAccept}
          disabled={!agreed || loading}
        >
          {loading ? 'Processing...' : 'I Agree — Continue'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page:     { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8', padding:16 },
  card:     { background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:600, boxShadow:'0 4px 24px rgba(0,0,0,0.1)' },
  icon:     { fontSize:48, textAlign:'center', marginBottom:12 },
  title:    { fontSize:24, fontWeight:700, textAlign:'center', color:'#2d3748', marginBottom:20 },
  box:      { background:'#fffbeb', border:'2px solid #f6ad55', borderRadius:10, padding:20, marginBottom:20 },
  p:        { marginBottom:12, fontSize:14, lineHeight:1.6, color:'#4a5568' },
  checkRow: { display:'flex', alignItems:'flex-start', marginBottom:20, cursor:'pointer', color:'#4a5568' },
  btn:      { width:'100%', padding:'14px', background:'#48bb78', color:'#fff', border:'none', borderRadius:8, fontSize:16, fontWeight:700 },
}
