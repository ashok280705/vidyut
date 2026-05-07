"""Inspections API."""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import get_supabase

router = APIRouter()

class InspectionUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None

@router.get("/")
async def list_inspections(status: str = Query("all"), limit: int = Query(50)):
    sb = get_supabase()
    if not sb:
        return {"items": []}
    query = sb.table("inspections").select(
        "*, meter:meters(meter_number, consumer_name, address, locality:localities(name)), engineer:profiles!assigned_to(full_name)"
    )
    if status != "all":
        query = query.eq("status", status)
    result = query.order("priority").limit(limit).execute()
    return {"items": result.data or []}

@router.put("/{inspection_id}")
async def update_inspection(inspection_id: str, update: InspectionUpdate):
    sb = get_supabase()
    if not sb:
        return {"error": "Not configured"}
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    if "status" in data and data["status"] == "resolved":
        from datetime import datetime
        data["completed_at"] = datetime.utcnow().isoformat()
    result = sb.table("inspections").update(data).eq("id", inspection_id).execute()
    return {"updated": len(result.data or [])}

@router.post("/{inspection_id}/assign")
async def assign_engineer(inspection_id: str, engineer_id: str):
    sb = get_supabase()
    if not sb:
        return {"error": "Not configured"}
    from datetime import datetime
    result = sb.table("inspections").update({
        "assigned_to": engineer_id,
        "status": "assigned",
        "assigned_at": datetime.utcnow().isoformat(),
    }).eq("id", inspection_id).execute()
    return {"assigned": len(result.data or [])}
