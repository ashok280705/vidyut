"""VIDYUT API Router — All endpoints."""
from fastapi import APIRouter
from app.api.meters import router as meters_router
from app.api.anomalies import router as anomalies_router
from app.api.forecasting import router as forecasting_router
from app.api.inspections import router as inspections_router
from app.api.analytics import router as analytics_router
from app.api.ingestion import router as ingestion_router
from app.api.system import router as system_router
from app.api.seed import router as seed_router

router = APIRouter()
router.include_router(meters_router, prefix="/meters", tags=["Meters"])
router.include_router(anomalies_router, prefix="/anomalies", tags=["Anomalies"])
router.include_router(forecasting_router, prefix="/forecasting", tags=["Forecasting"])
router.include_router(inspections_router, prefix="/inspections", tags=["Inspections"])
router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
router.include_router(ingestion_router, prefix="/ingestion", tags=["Ingestion"])
router.include_router(system_router, prefix="/system", tags=["System"])
router.include_router(seed_router, prefix="/seed", tags=["Seed"])
