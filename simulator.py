import requests
import random

URL = "http://127.0.0.1:8000/ingest"

days = 30
metrics = ["clicks", "conversion_rate", "latency", "error_rate"]

# 🎯 Random scenario each run
scenario = random.choice([
    "all_improve",
    "mixed",
    "no_change",
    "all_worse"
])

print(f"\n🚀 Running scenario: {scenario}\n")

def generate_value(metric, version):
    # Base values (BEFORE baseline)
    base = {
        "clicks": random.randint(80, 120),
        "conversion_rate": random.uniform(0.02, 0.05),
        "latency": random.randint(200, 300),
        "error_rate": random.uniform(0.01, 0.03)
    }
    

    if version == "before":
        return round(base[metric], 3)

    # AFTER logic based on scenario
    if scenario == "all_improve":
        if metric == "latency":
            return random.randint(120, 180)  # improved (lower)
        if metric == "error_rate":
            return round(random.uniform(0.005, 0.02), 3)  # improved
        return round(base[metric] * 1.2, 3)

    elif scenario == "mixed":
        if metric == "latency":
            return random.randint(120, 180)  # improved
        if metric == "error_rate":
            return round(random.uniform(0.04, 0.07), 3)  # worse ⚠️
        return round(base[metric] * 1.1, 3)

    elif scenario == "no_change":
        return round(base[metric] * random.uniform(0.95, 1.05), 3)

    elif scenario == "all_worse":
        if metric == "latency":
            return random.randint(300, 400)  # worse
        if metric == "error_rate":
            return round(random.uniform(0.05, 0.1), 3)  # worse
        return round(base[metric] * 0.8, 3)

# 🔹 SEND BEFORE DATA (30 days)
print("📊 Sending BEFORE data...\n")

for day in range(1, days + 1):
    for metric in metrics:
        data = {
            "metric_name": metric,
            "value": generate_value(metric, "before"),
            "version": "before"
        }

        try:
            res = requests.post(URL, json=data)

            if res.status_code == 200:
                print(f"Day {day} ✅ BEFORE Sent:", data)
            else:
                print("❌ Error:", res.status_code, res.text)

        except Exception as e:
            print("🚨 Request failed:", e)

# 🔹 SEND AFTER DATA (30 days)
print("\n📊 Sending AFTER data...\n")

for day in range(1, days + 1):
    for metric in metrics:
        data = {
            "metric_name": metric,
            "value": generate_value(metric, "after"),
            "version": "after"
        }

        try:
            res = requests.post(URL, json=data)

            if res.status_code == 200:
                print(f"Day {day} ✅ AFTER Sent:", data)
            else:
                print("❌ Error:", res.status_code, res.text)

        except Exception as e:
            print("🚨 Request failed:", e)

print("\n🎉 Demo data generation complete!\n")