from fastapi import FastAPI
from app.api.endpoints import router as timetable_router

app = FastAPI(
    title="AI Timetable Generator API",
    description="API for the AI-Based Timetable Generator using OR-Tools CP-SAT.",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "FastAPI scheduling server is running."}

app.include_router(timetable_router, prefix="/api/timetable", tags=["Timetable"])
