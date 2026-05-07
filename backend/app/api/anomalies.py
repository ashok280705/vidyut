"""Anomaly Detection API with real AI models."""
from fastapi import APIRouter, Query
from app.db.supabase import get_supabase

router = APIRouter()

@router.get("/")
async def list_anomalies(
    risk: str = Query("all"),
    status: str = Query("all"),
    limit: int = Query(50, ge=1, le=200),
):
    sb = get_supabase()
    if not sb:
        return {"items": []}

    query = sb.table("anomalies").select(
        "*, meter:meters(meter_number, consumer_name, locality:localities(name), feeder:feeders(code, name))"
    )
    if risk != "all":
        query = query.eq("risk_level", risk)
    if status != "all":
        query = query.eq("status", status)

    result = query.order("confidence_score", desc=True).limit(limit).execute()
    return {"items": result.data or []}

@router.get("/{anomaly_id}")
async def get_anomaly(anomaly_id: str):
    sb = get_supabase()
    if not sb:
        return {"error": "Not configured"}
    result = sb.table("anomalies").select(
        "*, meter:meters(*, locality:localities(name), feeder:feeders(*))"
    ).eq("id", anomaly_id).single().execute()
    return result.data

@router.post("/{anomaly_id}/status")
async def update_anomaly_status(anomaly_id: str, status: str):
    sb = get_supabase()
    if not sb:
        return {"error": "Not configured"}
    result = sb.table("anomalies").update({"status": status}).eq("id", anomaly_id).execute()
    return {"updated": len(result.data or [])}

@router.post("/detect")
async def run_detection():
    """Trigger anomaly detection pipeline."""
    from app.ml.anomaly_engine import AnomalyEngine
    engine = AnomalyEngine()
    results = await engine.run_detection()
    return {"detected": len(results), "anomalies": results}
