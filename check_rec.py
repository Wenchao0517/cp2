# -*- coding: utf-8 -*-
import requests, json

BASE = "http://127.0.0.1:5000"
login = requests.post(BASE + "/api/auth/login",
    json={"email": "test2@test.com", "password": "demo12345"}).json()
token = login.get("access_token") or login.get("token")
H = {"Authorization": "Bearer " + token}

r = requests.post(BASE + "/api/predict/assess", headers=H, json={})
data = r.json()
print("HTTP", r.status_code)
print("Response keys:", list(data.keys()))
for k in data:
    v = data[k]
    if isinstance(v, str) and len(v) > 80:
        print(f"\n--- {k} ---\n{v[:600]}")
    elif isinstance(v, (dict, list)):
        print(f"\n--- {k} ---\n{json.dumps(v, indent=2)[:600]}")
    else:
        print(f"{k}: {v}")
