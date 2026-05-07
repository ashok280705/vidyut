"""Analytics API."""
from fastapi import APIRouter, Query
from app.db.supabase import get_supabase

router = APIRouter()

@router.get("/demand-history")
async def demand_history(days: int = Query(7, ge=1, le=90)):
    sb = get_supabase()
    if not sb:
        return {"items": []}
    from datetime import datetime, timedelta
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    result = sb.rpc("get_demand_history", {"since_date": since}).execute()
    return {"items": result.data or []}

@router.get("/anomaly-trends")
async def anomaly_trends(months: int = Query(12)):
    sb = get_supabase()
    if not sb:
        return {"items": []}
    result = sb.rpc("get_anomaly_trends", {"num_months": months}).execute()
    return {"items": result.data or []}

@router.get("/locality-stats")
async def locality_stats():
    sb = get_supabase()
    if not sb:
        return {"items": []}
    result = sb.table("meters").select(
        "locality:localities(name), count"
    ).execute()
    return {"items": result.data or []}

@router.get("/model-performance")
async def model_performance():
    sb = get_supabase()
    if not sb:
        return {"items": []}
    result = sb.table("model_metrics").select("*").order("trained_at", desc=True).execute()
    return {"items": result.data or []}

@router.get("/dashboard-stats")
async def dashboard_stats():
    sb = get_supabase()
    if not sb:
        return {}
    result = sb.table("dashboard_stats").select("*").order("computed_at", desc=True).limit(1).execute()
    return result.data[0] if result.data else {}
