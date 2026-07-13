import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { patientAPI } from '../api/endpoints'

const C = {
  green:'#00C48C', blue:'#3B82F6', border:'#E8EDF2',
  text:'#1A2332', muted:'#6B7A8F', bg:'#F8FAFB', card:'#FFFFFF', red:'#FF6B6B'
}

const IcoWave    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
const IcoUser    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoHeart   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoActivity = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const IcoCheck   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,paddingBottom:12,borderBottom:'1px solid '+C.border}}>
    <div style={{width:36,height:36,borderRadius:10,background:C.green+'18',display:'flex',alignItems:'center',justifyContent:'center',color:C.green}}>{icon}</div>
    <div>
      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{title}</div>
      <div style={{fontSize:12,color:C.muted}}>{subtitle}</div>
    </div>
  </div>
)

const Toggle = ({ label, value, onChange, hint }) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid '+C.border}}>
    <div>
      <div style={{fontSize:13,fontWeight:600,color:C.text}}>{label}</div>
      {hint && <div style={{fontSize:11,color:C.muted,marginTop:2}}>{hint}</div>}
    </div>
    <button type="button" onClick={()=>onChange(!value)}
      style={{width:46,height:26,borderRadius:13,border:'none',cursor:'pointer',
        background:value?C.green:C.border, position:'relative',transition:'background 0.2s'}}>
      <div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:3,
        left:value?23:3,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
    </button>
  </div>
)

export default function ProfileSetup() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [doctorId, setDoctorId] = useState('')
  const [doctors, setDoctors]   = useState([])
  const [form, setForm] = useState({
    date_of_birth:'', gender:'', height_cm:'', weight_kg:'',
    has_hypertension:false, has_high_chol:false, smoker:false,
    family_history:false, physical_activity:true,
  })

  useEffect(() => {
    setLoading(true)
    patientAPI.listDoctors().then(r => setDoctors(r.data.doctors)).catch(()=>{})
    patientAPI.getProfile()
      .then(r => {
        const p = r.data.patient
        setDoctorId(p.doctor_id || '')
        setForm({
          date_of_birth:   p.date_of_birth || '',
          gender:          p.gender || '',
          height_cm:       p.height_cm || '',
          weight_kg:       p.weight_kg || '',
          has_hypertension:p.has_hypertension || false,
          has_high_chol:   p.has_high_chol || false,
          smoker:          p.smoker || false,
          family_history:  p.family_history || false,
          physical_activity:p.physical_activity !== false,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const bmi = form.height_cm && form.weight_kg
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm)/100, 2)).toFixed(1)
    : null

  const bmiStatus = bmi
    ? bmi < 18.5 ? {label:'Underweight',color:'#60A5FA'}
    : bmi < 25   ? {label:'Healthy',color:C.green}
    : bmi < 30   ? {label:'Overweight',color:C.green+'99'}
    :              {label:'Obese',color:C.red}
    : null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await patientAPI.selectDoctor(doctorId ? parseInt(doctorId) : null)
      await patientAPI.updateProfile({
        ...form,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch(err) {
      console.error(err)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontFamily:'-apple-system,sans-serif'}}>
      Loading profile...
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>

      <nav style={{background:C.card,borderBottom:'1px solid '+C.border,padding:'0 32px',height:62,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#00C48C,#00A070)',display:'flex',alignItems:'center',justifyContent:'center'}}><IcoWave/></div>
          <span style={{fontWeight:700,fontSize:17,color:C.text}}>DiabetesGuard</span>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>navigate('/dashboard')}
            style={{padding:'7px 16px',background:'transparent',color:C.muted,border:'1px solid '+C.border,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div style={{maxWidth:700,margin:'0 auto',padding:'28px 24px'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:'0 0 4px',letterSpacing:'-0.4px'}}>Health Profile</h1>
          <p style={{color:C.muted,fontSize:13,margin:0}}>Complete your profile to improve the accuracy of your diabetes risk assessment</p>
        </div>

        {saved && (
          <div style={{background:'#F0FDF8',border:'1px solid #86EFAC',color:C.green,padding:'10px 16px',borderRadius:10,marginBottom:18,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
            <IcoCheck/> Profile saved successfully
          </div>
        )}

        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:16}}>

          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
            <SectionHeader icon={<IcoUser/>} title="Personal Information" subtitle="Basic demographic details"/>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.6px'}}>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid '+C.border,borderRadius:9,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',color:C.text}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.6px'}}>Gender</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                  {['male','female','other'].map(v=>(
                    <button key={v} type="button" onClick={()=>setForm({...form,gender:v})}
                      style={{padding:'9px 4px',border:'1.5px solid '+(form.gender===v?C.green:C.border),borderRadius:8,
                        background:form.gender===v?'#F0FDF8':'transparent',color:form.gender===v?C.green:C.muted,
                        fontWeight:600,fontSize:12,cursor:'pointer',textTransform:'capitalize'}}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
            <SectionHeader icon={<IcoActivity/>} title="Body Measurements" subtitle="Used to calculate BMI for risk assessment"/>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.6px'}}>Height (cm)</label>
                <input type="number" min="100" max="250" step="0.1" value={form.height_cm}
                  onChange={e=>setForm({...form,height_cm:e.target.value})} placeholder="e.g. 170"
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid '+C.border,borderRadius:9,fontSize:14,fontWeight:600,outline:'none',boxSizing:'border-box',fontFamily:'inherit',color:C.text}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.6px'}}>Weight (kg)</label>
                <input type="number" min="20" max="300" step="0.1" value={form.weight_kg}
                  onChange={e=>setForm({...form,weight_kg:e.target.value})} placeholder="e.g. 70"
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid '+C.border,borderRadius:9,fontSize:14,fontWeight:600,outline:'none',boxSizing:'border-box',fontFamily:'inherit',color:C.text}}/>
              </div>
            </div>

            {bmi && (
              <div style={{background:C.bg,borderRadius:10,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:700}}>Calculated BMI</div>
                  <div style={{fontSize:22,fontWeight:700,color:bmiStatus.color,marginTop:2}}>{bmi}</div>
                </div>
                <div style={{padding:'5px 14px',borderRadius:20,background:bmiStatus.color+'18',color:bmiStatus.color,fontWeight:700,fontSize:13}}>
                  {bmiStatus.label}
                </div>
              </div>
            )}
          </div>

          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:22}}>
            <SectionHeader icon={<IcoHeart/>} title="Medical History" subtitle="These factors significantly affect diabetes risk prediction"/>

            <Toggle label="High Blood Pressure" hint="Diagnosed with hypertension by a doctor"
              value={form.has_hypertension} onChange={v=>setForm({...form,has_hypertension:v})}/>
            <Toggle label="High Cholesterol" hint="Diagnosed with high cholesterol by a doctor"
              value={form.has_high_chol} onChange={v=>setForm({...form,has_high_chol:v})}/>
            <Toggle label="Smoker" hint="Currently smoke or have smoked regularly"
              value={form.smoker} onChange={v=>setForm({...form,smoker:v})}/>
            <Toggle label="Family History of Diabetes" hint="Parent or sibling has been diagnosed with diabetes"
              value={form.family_history} onChange={v=>setForm({...form,family_history:v})}/>
            <Toggle label="Physically Active" hint="At least 30 minutes of moderate exercise most days"
              value={form.physical_activity} onChange={v=>setForm({...form,physical_activity:v})}/>
          </div>

          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:24,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:40,height:40,borderRadius:11,background:'#3B82F614',display:'flex',alignItems:'center',justifyContent:'center',color:'#3B82F6'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>My Doctor</div>
                <div style={{fontSize:12.5,color:C.muted}}>Choose your clinician to enable two-way messaging</div>
              </div>
            </div>
            <select value={doctorId} onChange={e=>setDoctorId(e.target.value)}
              style={{width:'100%',padding:'12px 14px',border:'2px solid '+C.border,borderRadius:12,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:'#FBFDFC',cursor:'pointer'}}>
              <option value="">-- No doctor selected --</option>
              {doctors.map(d=>(
                <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
              ))}
            </select>
          </div>
          <div style={{display:'flex',gap:12}}>
            <button type="submit" disabled={saving}
              style={{flex:1,padding:'13px',background:'linear-gradient(135deg,#00C48C,#00A070)',color:'#fff',border:'none',borderRadius:11,fontSize:15,fontWeight:700,cursor:'pointer',opacity:saving?0.7:1,fontFamily:'inherit'}}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button" onClick={()=>navigate('/dashboard')}
              style={{padding:'13px 24px',background:'transparent',color:C.muted,border:'1.5px solid '+C.border,borderRadius:11,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}







