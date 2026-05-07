"""Meters API."""
from fastapi import APIRouter, Query
from app.db.supabase import get_supabase

router = APIRouter()

@router.get("/")
async def list_meters(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    risk: str = Query("all"),
    meter_type: str = Query("all"),
    search: str = Query(""),
):
    sb = get_supabase()
    if not sb:
        return {"items": [], "total": 0, "page": page}

    query = sb.table("meters").select(
        "*, locality:localities(name), feeder:feeders(code, name)",
        count="exact"
    )
    if risk != "all":
        query = query.eq("risk_level", risk)
    if meter_type != "all":
        query = query.eq("meter_type", meter_type)
    if search:
        query = query.or_(f"consumer_name.ilike.%{search}%,meter_number.ilike.%{search}%")

    offset = (page - 1) * per_page
    result = query.range(offset, offset + per_page - 1).order("anomaly_score", desc=True).execute()

    return {"items": result.data or [], "total": result.count or 0, "page": page}

@router.get("/{meter_id}")
async def get_meter(meter_id: str):
    sb = get_supabase()
    if not sb:
        return {"error": "Not configured"}
    result = sb.table("meters").select("*, locality:localities(name), feeder:feeders(*)").eq("id", meter_id).single().execute()
    return result.data

@router.get("/{meter_id}/readings")
async def get_readings(meter_id: str, days: int = Query(7, ge=1, le=90)):
    sb = get_supabase()
    if not sb:
        return {"items": []}
    from datetime import datetime, timedelta
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    result = sb.table("meter_readings").select("*").eq("meter_id", meter_id).gte("timestamp", since).order("timestamp", desc=True).limit(1000).execute()
    return {"items": result.data or []}
