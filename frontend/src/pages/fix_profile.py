# -*- coding: utf-8 -*-
content = open('ProfileSetup.jsx', 'r', encoding='utf-8').read()

# 1. Load doctors list
old1 = """    setLoading(true)
    patientAPI.getProfile()"""
new1 = """    setLoading(true)
    patientAPI.listDoctors().then(r => setDoctors(r.data.doctors)).catch(()=>{})
    patientAPI.getProfile()"""
if old1 in content:
    content = content.replace(old1, new1, 1)
    print('1. Load logic: OK')
else:
    print('1. Load logic: SKIP (not found or already added)')

# 2. Set current doctor on load
old2 = """        const p = r.data.patient
        setForm({"""
new2 = """        const p = r.data.patient
        setDoctorId(p.doctor_id || '')
        setForm({"""
if old2 in content:
    content = content.replace(old2, new2, 1)
    print('2. Set doctorId: OK')
else:
    print('2. Set doctorId: SKIP')

# 3. UI card - insert before the buttons row
old3 = """          </div>
          <div style={{display:'flex',gap:12}}>"""
new3 = """          </div>

          <div style={{background:C.card,border:'1px solid '+C.border,borderRadius:18,padding:24}}>
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
          <div style={{display:'flex',gap:12}}>"""
if old3 in content:
    content = content.replace(old3, new3, 1)
    print('3. UI card: OK')
else:
    print('3. UI card: NOT FOUND - check anchor')

open('ProfileSetup.jsx', 'w', encoding='utf-8').write(content)
print('Saved!')
