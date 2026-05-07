"""Ingestion Pipeline API."""
from fastapi import APIRouter, UploadFile, File
from app.db.supabase import get_supabase
import csv, io, uuid
from datetime import datetime

router = APIRouter()

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Ingest meter readings from CSV."""
    sb = get_supabase()
    if not sb:
        return {"error": "Supabase not configured"}

    log_id = str(uuid.uuid4())
    sb.table("ingestion_logs").insert({
        "id": log_id,
        "filename": file.filename,
        "status": "processing",
        "started_at": datetime.utcnow().isoformat(),
    }).execute()

    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    total_rows = 0
    processed = 0
    failed = 0
    batch = []

    for row in reader:
        total_rows += 1
        try:
            record = {
                "meter_id": row.get("meter_id", ""),
                "timestamp": row.get("timestamp", datetime.utcnow().isoformat()),
                "reading_kwh": float(row.get("reading_kwh", 0)),
                "voltage": float(row.get("voltage", 0)) if row.get("voltage") else None,
                "current_amp": float(row.get("current_amp", 0)) if row.get("current_amp") else None,
                "power_factor": float(row.get("power_factor", 0)) if row.get("power_factor") else None,
            }
            batch.append(record)
            if len(batch) >= 500:
                sb.table("meter_readings").insert(batch).execute()
                processed += len(batch)
                batch = []
        except Exception:
            failed += 1

    if batch:
        sb.table("meter_readings").insert(batch).execute()
        processed += len(batch)

    sb.table("ingestion_logs").update({
        "total_rows": total_rows,
        "processed_rows": processed,
        "failed_rows": failed,
        "status": "completed" if failed == 0 else "partial",
        "completed_at": datetime.utcnow().isoformat(),
    }).eq("id", log_id).execute()

    return {
        "log_id": log_id,
        "total_rows": total_rows,
        "processed": processed,
        "failed": failed,
    }

@router.get("/logs")
async def ingestion_logs():
    sb = get_supabase()
    if not sb:
        return {"items": []}
    result = sb.table("ingestion_logs").select("*").order("created_at", desc=True).limit(20).execute()
    return {"items": result.data or []}
