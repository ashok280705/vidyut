"""
VIDYUT — Production Database Seeder
Generates realistic BESCOM-style synthetic data.
500+ meters, 90+ days readings, seasonal patterns, anomalies.
"""
from fastapi import APIRouter
from app.db.supabase import get_supabase
import random, uuid, math
from datetime import datetime, timedelta

router = APIRouter()

LOCALITIES = [
    ("Koramangala", "South", 12.9352, 77.6245),
    ("Indiranagar", "East", 12.9716, 77.6412),
    ("HSR Layout", "South", 12.9116, 77.6474),
    ("Whitefield", "East", 12.9698, 77.7500),
    ("Electronic City", "South", 12.8456, 77.6603),
    ("Marathahalli", "East", 12.9591, 77.7009),
    ("JP Nagar", "South", 12.9063, 77.5857),
    ("BTM Layout", "South", 12.9166, 77.6101),
    ("Jayanagar", "South", 12.9250, 77.5938),
    ("MG Road", "Central", 12.9756, 77.6068),
    ("Rajajinagar", "West", 12.9863, 77.5520),
    ("Malleshwaram", "West", 13.0035, 77.5706),
    ("Basavanagudi", "South", 12.9422, 77.5756),
    ("Yelahanka", "North", 13.1007, 77.5963),
    ("Hebbal", "North", 13.0350, 77.5970),
    ("Banashankari", "South", 12.9255, 77.5468),
    ("RT Nagar", "North", 13.0212, 77.5967),
    ("Vijayanagar", "West", 12.9697, 77.5309),
    ("KR Puram", "East", 13.0074, 77.6963),
    ("Bannerghatta", "South", 12.8698, 77.5947),
]

FEEDER_NAMES = [
    "KMG-F01", "IND-F02", "HSR-F03", "WHF-F04", "ELC-F05",
    "MRH-F06", "JPN-F07", "BTM-F08", "JAY-F09", "MGR-F10",
    "RAJ-F11", "MAL-F12", "BAS-F13", "YEL-F14", "HEB-F15",
    "BNK-F16", "RTN-F17", "VIJ-F18", "KRP-F19", "BNG-F20",
    "KMG-F21", "IND-F22", "HSR-F23", "WHF-F24",
]

CONSUMER_FIRST = ["Rajesh", "Priya", "Anil", "Kavitha", "Suresh", "Deepa", "Vikram", "Lakshmi", "Ramesh", "Sunitha", "Venkat", "Pooja", "Karthik", "Divya", "Ravi", "Ananya", "Manoj", "Rekha", "Srinivas", "Meena"]
CONSUMER_LAST = ["Kumar", "Sharma", "Reddy", "S", "M", "Rao", "Gowda", "B", "R", "N", "L", "Patil", "K", "D", "P"]

ANOMALY_RULES = [
    ("sudden_zero_drop", "Sudden Zero Drop", "critical"),
    ("repeated_identical", "Repeated Identical Readings", "high"),
    ("post_midnight_spike", "Post-Midnight Spike", "high"),
    ("rapid_reconnection", "Rapid Reconnection", "critical"),
    ("seasonal_inversion", "Seasonal Inversion", "medium"),
    ("billing_cycle_dip", "Billing Cycle Dip", "high"),
    ("peer_deviation", "Peer Group Deviation", "medium"),
    ("isolation_forest", "Isolation Forest Outlier", "medium"),
]

ENGINEERS = ["Rajesh Kumar", "Anil Reddy", "Venkat R", "Karthik M", "Ravi S", "Manoj P"]

def _gen_id():
    return str(uuid.uuid4())

def _rand_consumer():
    return f"{random.choice(CONSUMER_FIRST)} {random.choice(CONSUMER_LAST)}"

def _demand_profile(hour: int, day_of_week: int, temp: float) -> float:
    """Realistic Bangalore demand curve."""
    base = 180
    # Morning peak 8-10
    if 8 <= hour <= 10:
        base += 60
    # Afternoon plateau with temp correlation
    elif 11 <= hour <= 16:
        base += 40 + (temp - 28) * 5
    # Evening peak 18-22
    elif 18 <= hour <= 22:
        base += 80
    # Night trough
    elif 0 <= hour <= 5:
        base -= 40

    # Weekend reduction
    if day_of_week >= 5:
        base *= 0.85

    return base + random.gauss(0, 8)


@router.post("/full")
async def seed_full_database():
    """Seed the entire database with realistic BESCOM data."""
    sb = get_supabase()
    if not sb:
        return {"error": "Supabase not configured"}

    results = {}

    # 1. Localities
    locality_records = []
    locality_ids = {}
    for name, zone, lat, lng in LOCALITIES:
        lid = _gen_id()
        locality_ids[name] = lid
        locality_records.append({
            "id": lid, "name": name, "zone": zone,
            "lat": lat, "lng": lng,
            "population_estimate": random.randint(50000, 500000),
        })
    sb.table("localities").upsert(locality_records, on_conflict="name").execute()
    results["localities"] = len(locality_records)

    # 2. Feeders
    feeder_records = []
    feeder_ids = {}
    for i, code in enumerate(FEEDER_NAMES):
        fid = _gen_id()
        loc_name = LOCALITIES[i % len(LOCALITIES)][0]
        _, _, lat, lng = LOCALITIES[i % len(LOCALITIES)]
        feeder_ids[code] = fid
        feeder_records.append({
            "id": fid, "code": code,
            "name": f"Feeder {code}",
            "locality_id": locality_ids[loc_name],
            "capacity_kw": random.choice([500, 750, 1000, 1250, 1500]),
            "status": random.choices(["healthy", "warning", "critical"], weights=[75, 20, 5])[0],
            "lat": lat + random.uniform(-0.01, 0.01),
            "lng": lng + random.uniform(-0.01, 0.01),
        })
    sb.table("feeders").upsert(feeder_records, on_conflict="code").execute()
    results["feeders"] = len(feeder_records)

    # 3. Transformers
    transformer_records = []
    for code, fid in feeder_ids.items():
        for j in range(random.randint(2, 5)):
            loc_data = LOCALITIES[list(feeder_ids.keys()).index(code) % len(LOCALITIES)]
            transformer_records.append({
                "id": _gen_id(),
                "name": f"TR-{code}-{j+1:02d}",
                "feeder_id": fid,
                "capacity_kva": random.choice([100, 250, 500]),
                "lat": loc_data[2] + random.uniform(-0.005, 0.005),
                "lng": loc_data[3] + random.uniform(-0.005, 0.005),
                "status": random.choices(["healthy", "warning", "critical"], weights=[80, 15, 5])[0],
            })
    sb.table("transformers").insert(transformer_records).execute()
    results["transformers"] = len(transformer_records)

    # 4. Meters (500+)
    meter_records = []
    meter_ids = []
    feeder_keys = list(feeder_ids.keys())
    for i in range(550):
        mid = _gen_id()
        meter_ids.append(mid)
        loc_idx = i % len(LOCALITIES)
        loc_name = LOCALITIES[loc_idx][0]
        fdr_code = feeder_keys[i % len(feeder_keys)]
        mtype = random.choices(["residential", "commercial", "industrial"], weights=[70, 20, 10])[0]
        base_kwh = {"residential": random.uniform(5, 25), "commercial": random.uniform(20, 80), "industrial": random.uniform(50, 200)}[mtype]
        anomaly_score = random.random()
        risk = "red" if anomaly_score > 0.7 else ("amber" if anomaly_score > 0.3 else "green")

        meter_records.append({
            "id": mid,
            "meter_number": f"BES{100000 + i:06d}",
            "consumer_name": _rand_consumer(),
            "address": f"#{random.randint(1,500)}, {random.choice(['Main Rd','Cross St','Layout','Nagar','Colony'])}, {loc_name}",
            "feeder_id": feeder_ids[fdr_code],
            "locality_id": locality_ids[loc_name],
            "meter_type": mtype,
            "status": random.choices(["active", "inactive", "tampered", "faulty"], weights=[85, 5, 6, 4])[0],
            "lat": LOCALITIES[loc_idx][2] + random.uniform(-0.015, 0.015),
            "lng": LOCALITIES[loc_idx][3] + random.uniform(-0.015, 0.015),
            "avg_daily_kwh": round(base_kwh, 2),
            "anomaly_score": round(anomaly_score, 3),
            "risk_level": risk,
            "installed_at": (datetime.utcnow() - timedelta(days=random.randint(30, 1800))).isoformat(),
        })

    # Insert in batches
    for batch_start in range(0, len(meter_records), 100):
        batch = meter_records[batch_start:batch_start + 100]
        sb.table("meters").insert(batch).execute()
    results["meters"] = len(meter_records)

    # 5. Meter readings (90 days, hourly, sampled subset for speed)
    now = datetime.utcnow()
    sampled_meters = random.sample(meter_ids, min(100, len(meter_ids)))
    reading_count = 0

    for meter_id in sampled_meters:
        readings_batch = []
        meter_rec = next(m for m in meter_records if m["id"] == meter_id)
        base = meter_rec["avg_daily_kwh"]

        for day_offset in range(90):
            dt = now - timedelta(days=day_offset)
            for hour in range(0, 24, 2):  # Every 2 hours for speed
                ts = dt.replace(hour=hour, minute=0, second=0)
                temp = 28 + 5 * math.sin((hour - 14) * math.pi / 12)
                kwh = base * (0.3 + 0.7 * _demand_profile(hour, dt.weekday(), temp) / 250)
                kwh = max(0, kwh + random.gauss(0, base * 0.1))

                readings_batch.append({
                    "meter_id": meter_id,
                    "timestamp": ts.isoformat(),
                    "reading_kwh": round(kwh, 3),
                    "voltage": round(220 + random.gauss(0, 5), 1),
                    "current_amp": round(kwh / 220 * 1000, 2),
                    "power_factor": round(random.uniform(0.85, 0.99), 3),
                })

        # Insert in chunks
        for chunk_start in range(0, len(readings_batch), 500):
            chunk = readings_batch[chunk_start:chunk_start + 500]
            sb.table("meter_readings").insert(chunk).execute()
            reading_count += len(chunk)

    results["meter_readings"] = reading_count

    # 6. Weather (90 days)
    weather_records = []
    for day_offset in range(90):
        dt = now - timedelta(days=day_offset)
        for hour in range(0, 24, 3):
            ts = dt.replace(hour=hour, minute=0, second=0)
            temp = 26 + 6 * math.sin((hour - 14) * math.pi / 12) + random.gauss(0, 1.5)
            weather_records.append({
                "timestamp": ts.isoformat(),
                "temperature_c": round(temp, 1),
                "humidity_percent": round(random.uniform(40, 85), 1),
                "cloud_cover_percent": round(random.uniform(0, 80), 0),
                "rainfall_mm": round(max(0, random.gauss(-2, 4)), 1),
                "wind_speed_kmh": round(random.uniform(2, 20), 1),
                "condition": random.choice(["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Sunny"]),
                "is_holiday": random.random() < 0.05,
            })
    for batch_start in range(0, len(weather_records), 200):
        sb.table("weather_data").insert(weather_records[batch_start:batch_start + 200]).execute()
    results["weather_data"] = len(weather_records)

    # 7. Anomaly rules
    rule_records = [{
        "rule_key": key, "label": label, "severity": sev,
        "description": f"Detects {label.lower()} patterns in consumption data",
        "threshold": random.uniform(0.5, 0.8),
        "weight": random.uniform(0.8, 1.2),
    } for key, label, sev in ANOMALY_RULES]
    sb.table("anomaly_rules").upsert(rule_records, on_conflict="rule_key").execute()
    results["anomaly_rules"] = len(rule_records)

    # 8. Anomalies
    anomaly_records = []
    for i in range(40):
        meter = random.choice(meter_records)
        expected = meter["avg_daily_kwh"]
        actual = expected * random.uniform(0.05, 0.6)
        z = (expected - actual) / max(expected * 0.15, 0.1)
        conf = min(0.99, 0.4 + random.random() * 0.55)
        rules = random.sample([r[0] for r in ANOMALY_RULES], random.randint(1, 3))
        risk = "red" if conf > 0.7 else ("amber" if conf > 0.4 else "green")
        shap = [
            {"feature": "z_score", "contribution": round(random.uniform(0.1, 0.4), 3), "direction": "positive"},
            {"feature": "peer_deviation", "contribution": round(random.uniform(0.05, 0.3), 3), "direction": "positive"},
            {"feature": "time_regularity", "contribution": round(random.uniform(-0.2, 0.1), 3), "direction": random.choice(["positive", "negative"])},
            {"feature": "seasonal_fit", "contribution": round(random.uniform(-0.15, 0.05), 3), "direction": "negative"},
            {"feature": "voltage_stability", "contribution": round(random.uniform(-0.1, 0.15), 3), "direction": random.choice(["positive", "negative"])},
        ]
        anomaly_records.append({
            "id": _gen_id(),
            "meter_id": meter["id"],
            "detected_at": (now - timedelta(hours=random.randint(1, 720))).isoformat(),
            "anomaly_type": random.choice([r[0] for r in ANOMALY_RULES]),
            "confidence_score": round(conf, 3),
            "risk_level": risk,
            "status": random.choices(["new", "investigating", "confirmed", "resolved"], weights=[40, 25, 20, 15])[0],
            "z_score": round(z, 2),
            "expected_kwh": round(expected, 2),
            "actual_kwh": round(actual, 2),
            "deviation_percent": round((expected - actual) / expected * 100, 1),
            "peer_avg_kwh": round(expected * random.uniform(0.85, 1.15), 2),
            "description": f"Anomalous consumption detected for {meter['consumer_name']}",
            "rules_triggered": rules,
            "shap_values": shap,
        })
    sb.table("anomalies").insert(anomaly_records).execute()
    results["anomalies"] = len(anomaly_records)

    # 9. Inspections
    inspection_records = []
    for i, anom in enumerate(anomaly_records[:25]):
        inspection_records.append({
            "id": _gen_id(),
            "anomaly_id": anom["id"],
            "meter_id": anom["meter_id"],
            "priority": i + 1,
            "confidence_score": anom["confidence_score"],
            "status": random.choices(["pending", "assigned", "investigating", "resolved"], weights=[35, 25, 25, 15])[0],
            "assigned_to": None,
            "notes": random.choice([None, "Site visit scheduled", "Consumer contacted", "Meter inspection required"]),
        })
    sb.table("inspections").insert(inspection_records).execute()
    results["inspections"] = len(inspection_records)

    # 10. Forecasts (48 hours ahead)
    forecast_records = []
    for h in range(48):
        ts = now + timedelta(hours=h)
        pred = _demand_profile(ts.hour, ts.weekday(), 30)
        forecast_records.append({
            "target_timestamp": ts.isoformat(),
            "predicted_kwh": round(pred, 2),
            "lower_bound": round(pred * 0.88, 2),
            "upper_bound": round(pred * 1.12, 2),
            "confidence": round(random.uniform(0.85, 0.97), 3),
            "risk_level": "red" if pred > 250 else ("amber" if pred > 200 else "green"),
            "model_version": "v2.4.1",
        })
    sb.table("forecasts").insert(forecast_records).execute()
    results["forecasts"] = len(forecast_records)

    # 11. Model metrics
    model_records = [
        {"model_name": "LightGBM Demand", "version": "v2.4.1", "accuracy": 0.963, "precision_score": 0.945, "recall": 0.938, "f1_score": 0.941, "false_positive_rate": 0.032, "training_samples": 45200},
        {"model_name": "Isolation Forest", "version": "v1.8.0", "accuracy": 0.921, "precision_score": 0.887, "recall": 0.912, "f1_score": 0.899, "false_positive_rate": 0.068, "training_samples": 45200},
        {"model_name": "Peer Comparator", "version": "v3.1.2", "accuracy": 0.944, "precision_score": 0.923, "recall": 0.956, "f1_score": 0.939, "false_positive_rate": 0.044, "training_samples": 45200},
    ]
    sb.table("model_metrics").insert(model_records).execute()
    results["model_metrics"] = len(model_records)

    # 12. Activity logs
    activities = []
    for i in range(30):
        activities.append({
            "type": random.choice(["anomaly_detected", "inspection_assigned", "model_retrained", "alert_triggered"]),
            "title": random.choice([
                "New anomaly detected in Koramangala",
                "Inspection assigned to Anil Reddy",
                "LightGBM model retrained",
                "Grid stress alert in Whitefield",
                "Meter tamper detected",
                "Forecast generated for 48h",
            ]),
            "description": "Automated system event",
            "severity": random.choices(["info", "warning", "critical"], weights=[50, 35, 15])[0],
            "created_at": (now - timedelta(minutes=random.randint(1, 2880))).isoformat(),
        })
    sb.table("activity_logs").insert(activities).execute()
    results["activity_logs"] = len(activities)

    # 13. Dashboard stats
    sb.table("dashboard_stats").insert({
        "total_meters": len(meter_records),
        "active_feeders": len(feeder_records),
        "active_anomalies": len([a for a in anomaly_records if a["status"] in ("new", "investigating")]),
        "theft_alerts": len([a for a in anomaly_records if a["status"] == "confirmed"]),
        "inspections_pending": len([i for i in inspection_records if i["status"] == "pending"]),
        "current_demand_mw": round(_demand_profile(now.hour, now.weekday(), 30), 1),
        "grid_health_score": round(random.uniform(90, 98), 1),
        "ai_confidence": round(random.uniform(88, 95), 1),
        "daily_forecast_accuracy": round(random.uniform(93, 98), 1),
        "computed_at": now.isoformat(),
    }).execute()
    results["dashboard_stats"] = 1

    # 14. System health snapshot
    sb.table("system_health").insert({
        "api_latency_ms": 24.5,
        "db_connections": 12,
        "db_health": "healthy",
        "ingestion_rate": 450.0,
        "model_health": "healthy",
        "realtime_sync": "connected",
        "uptime_hours": 99.9,
    }).execute()
    results["system_health"] = 1

    return {"status": "success", "records_created": results}
