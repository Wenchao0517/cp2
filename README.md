# DiabetesGuard

**A Web-Based Diabetes Risk Assessment and Glucose Monitoring Platform**

Capstone Project 2 — Ng Wen Chao (22049613), Bachelor of Computer Science, Sunway University
Supervisor: David Oleyami Alebiosu

DiabetesGuard connects three things that existing tools keep separate: machine-learning risk prediction that responds to the user's **real glucose readings**, per-prediction **explainability** (SHAP), and a **clinician link** so a supervising doctor can monitor the patient's data. Risk is predicted by a calibrated Random Forest (AUC 0.977) trained on the Kaggle Diabetes Prediction Dataset (100,000 records), explained with SHAP TreeExplainer, and translated into plain-language recommendations by an LLM (Groq, llama-3.1-8b-instant) with a rule-based fallback when the LLM is unavailable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Flask (Python) REST API |
| Database | SQLite via SQLAlchemy |
| ML Model | Random Forest (scikit-learn), isotonic calibration, 5-fold stratified CV |
| Explainability | SHAP TreeExplainer |
| Recommendations | Groq API (llama-3.1-8b-instant) with rule-based fallback |
| Deployment (demo) | Local + ngrok tunnel |

---

## Installation and Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free Groq API key from https://console.groq.com (optional — the app still works fully without one; recommendations then come from the rule-based fallback)

### 1. Clone the repository

```bash
git clone https://github.com/Wenchao0517/cp2.git
cd cp2
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```
GROQ_API_KEY=your_groq_api_key_here
```

The trained ML artifacts (model, calibrator, SHAP explainer inputs) must be present in `backend/ml/`. They are included in the repository. To retrain from scratch, run the training script **from the repository root** (path discipline matters — the script resolves paths relative to the root):

```bash
python train_model.py
```

Start the backend from the `backend/` directory:

```bash
python run.py
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). To test across devices, expose the app with ngrok.

---

## How the System Works

DiabetesGuard has two roles, chosen at registration: **Patient** and **Doctor**. Every account must pass an explicit disclaimer-and-consent step before any health feature is available — the system is a screening and monitoring aid, not a diagnostic tool. Passwords are stored as salted hashes, sessions use integrity-protected tokens, and security-relevant actions are written to an audit log.

---

## Patient Guide

### 1. Register and consent
Create an account with an email and password and select the **Patient** role. On first login you are shown the medical disclaimer; health features unlock only after you give explicit consent.

### 2. Complete your Health Profile
The Health Profile page is organised into four cards:

- **Personal Information** — date of birth and gender.
- **Body Measurements** — height and weight; BMI is computed live as you type, with a classification badge (e.g. Normal, Overweight, Obese).
- **Medical History** — toggles for hypertension, high cholesterol, smoking, family history of diabetes, heart disease, and physical activity. These feed the risk model.
- **My Doctor** — select your supervising clinician from the dropdown. This creates the patient–doctor link that powers the clinician dashboard and two-way messaging.

### 3. Log glucose readings
From the dashboard, log a blood glucose reading (mmol/L) together with its meal context (e.g. fasting, after meal). The **History** tab lists all readings, each deletable with a confirmation step. The dashboard summarises your data in six statistic cards: latest reading, seven-day average, seven-day maximum and minimum, estimated HbA1c, and total readings. If your readings repeatedly exceed the high-glucose threshold (10 mmol/L), a red **High Blood Glucose Alert** banner appears advising you to consult a doctor.

### 4. Run a Risk Assessment
Press **Assess My Risk** on the Risk Assessment card. The backend:

1. Builds a feature vector from your profile **and** your recent glucose readings (this is what makes the prediction responsive to your actual data rather than static);
2. Runs the calibrated Random Forest to produce a risk **probability** and classification (LOW / MODERATE / HIGH / VERY HIGH), shown as a probability ring;
3. Computes **SHAP values** for your individual prediction — the top contributing features appear as red **Risk factor** badges (e.g. HbA1c level, blood glucose level) and green **Protective** badges (e.g. younger age);
4. Generates **personalised recommendations** — lifestyle and dietary guidance in plain language, produced by the Groq LLM from your risk level and SHAP factors. If the LLM service is unreachable, a rule-based engine generates deterministic recommendations from the same inputs, so the feature never fails.

### 5. Track your history and messages
The **Risk History** view charts your assessments over time as a trend. The messaging panel lets you read notes from your supervising doctor and reply to them.

---

## Doctor Guide

### 1. Register as a clinician
Create an account and select the **Doctor** role (the same disclaimer/consent step applies). Your name then becomes selectable in patients' "My Doctor" dropdown; patients link themselves to you.

### 2. Monitor your patient list
The clinician dashboard lists all patients who selected you, showing each patient's latest reading and current risk level at a glance, so the highest-risk patients are easy to spot.

### 3. Review an individual patient
Selecting a patient opens their detail view with three tabs:

- **Glucose Chart** — the patient's readings plotted over time, revealing trends the raw numbers hide.
- **Readings** — the full table of logged readings with values and meal context.
- **Notes** — your message history with this patient.

You also see the patient's risk assessment history and the SHAP factors behind their latest score, so you can see *why* the model rated them as it did, not just the number.

### 4. Message the patient
Write notes to the patient from the Notes tab. Messages appear on the patient's dashboard, and the patient can reply — closing the loop between self-monitoring and clinical oversight.

---

## Typical Demo Walkthrough

1. Register a **doctor** account (e.g. `dr.tan@example.com`).
2. Register a **patient** account, accept the consent step, complete the health profile, and select the doctor in the My Doctor card.
3. As the patient, log several glucose readings (include some above 10 mmol/L to trigger the alert banner), then run a risk assessment and review the probability ring, SHAP badges, and recommendations.
4. Log back in as the doctor: the patient now appears on the dashboard with their risk level; open the glucose chart, review readings, and send a note.
5. Return to the patient account to read and reply to the doctor's note.

---

## Project Structure

```
cp2/
├── backend/
│   ├── app/
│   │   ├── auth/          # registration, login, session tokens, consent
│   │   ├── predict/       # risk assessment endpoint, glucose-adjustment logic
│   │   ├── ...            # profiles, readings, doctor, messaging routes
│   ├── ml/                # trained model artifacts (joblib)
│   ├── .env               # GROQ_API_KEY (not committed)
│   └── run.py             # backend entry point
├── frontend/
│   ├── src/               # React components and pages
│   └── ...
└── train_model.py         # ML training pipeline (run from repo root)
```

---

## Notes and Limitations

- DiabetesGuard is an academic prototype for screening support. It does not provide medical diagnoses, and all recommendations are advisory.
- The ML model is trained and evaluated on a public benchmark dataset; the reported AUC (0.977) reflects performance on that dataset, not clinical validation.
- Model artifacts are saved and must be loaded with `joblib` (not `pickle`).
- If the Groq key is missing or invalid, the system automatically serves rule-based recommendations (~130 ms) instead of LLM recommendations (~700 ms end-to-end).
