# -*- coding: utf-8 -*-
import time, statistics
import requests

BASE = "http://127.0.0.1:5000"
EMAIL = "test2@test.com"
PASSWORD = "demo12345"

def timed(name, fn, n=20):
    times = []
    for i in range(n):
        t0 = time.perf_counter()
        try:
            r = fn()
        except Exception as e:
            print(f"{name:<52} ERROR: {e}")
            return
        dt = (time.perf_counter() - t0) * 1000
        if r.status_code >= 400:
            print(f"{name:<52} HTTP {r.status_code}: {r.text[:100]}")
            return
        if i > 0:
            times.append(dt)
    times.sort()
    mean = statistics.mean(times)
    p95 = times[int(len(times) * 0.95) - 1]
    print(f"{name:<52} mean = {mean:7.1f} ms   P95 = {p95:7.1f} ms   (n={n-1})")

print(f"Target {BASE}")
print("-" * 88)

timed("PT-01 POST /api/auth/login", lambda: requests.post(
    BASE + "/api/auth/login", json={"email": EMAIL, "password": PASSWORD}))

login = requests.post(BASE + "/api/auth/login",
    json={"email": EMAIL, "password": PASSWORD}).json()
token = login.get("access_token") or login.get("token")
if not token:
    print("Login response keys:", list(login.keys()))
    raise SystemExit("no token found - paste this output to Claude")
H = {"Authorization": "Bearer " + token}

timed("PT-02 GET  /api/patients/glucose", lambda: requests.get(
    BASE + "/api/patients/glucose", headers=H))

timed("PT-03 POST /api/patients/glucose", lambda: requests.post(
    BASE + "/api/patients/glucose", headers=H,
    json={"glucose_mmol": 6.2, "meal_context": "fasting"}))

timed("PT-06 GET  /api/predict/latest", lambda: requests.get(
    BASE + "/api/predict/latest", headers=H))

timed("PT-04/05 POST /api/predict/assess", lambda: requests.post(
    BASE + "/api/predict/assess", headers=H, json={}), n=10)

print("-" * 88)
print("Done. Paste everything above back to Claude.")
