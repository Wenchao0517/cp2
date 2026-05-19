import api from './client'

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
  logout:   ()     => api.post('/api/auth/logout'),
  me:       ()     => api.get('/api/auth/me'),
  consent:  ()     => api.post('/api/auth/consent'),
}

export const patientAPI = {
  getProfile:    ()     => api.get('/api/patients/profile'),
  updateProfile: (data) => api.put('/api/patients/profile', data),
  addGlucose:    (data) => api.post('/api/patients/glucose', data),
  getGlucose:    (limit=30) => api.get('/api/patients/glucose', { params: { limit } }),
  getAssessments:()     => api.get('/api/patients/assessments'),
}

export const predictAPI = {
  runAssessment: () => api.post('/api/predict/assess'),
  getLatest:     () => api.get('/api/predict/latest'),
}

export const clinicianAPI = {
  getPatients:      (risk) => api.get('/api/clinician/patients', { params: risk ? { risk } : {} }),
  getPatientDetail: (id)   => api.get('/api/clinician/patients/' + id),
  getStats:         ()     => api.get('/api/clinician/stats'),
  assignPatient:    (id)   => api.post('/api/clinician/assign/' + id),
}
