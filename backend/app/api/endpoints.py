from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from app.schemas.scheduler import GenerateRequest, ValidateRequest, TimetableResponse, ScheduledClassSchema, ScheduleMetricsSchema
from app.scheduler.engine import solve_timetable
from app.scheduler.validator import validate_timetable, calculate_metrics
from app.scheduler.orchestrator import prepare_semester_input
from app.db.connection import get_scheduler_input, save_schedule, get_active_schedule
from pydantic import BaseModel

class GenerateSemesterRequest(BaseModel):
    semester_id: str

router = APIRouter()

@router.post("/generate", response_model=TimetableResponse)
def generate_timetable(request: GenerateRequest):
    # Convert API schemas to internal dataclasses
    try:
        timeslots = [t.to_internal() for t in request.timeslots]
        rooms = [r.to_internal() for r in request.rooms]
        faculty = [f.to_internal() for f in request.faculty]
        courses = [c.to_internal() for c in request.courses]
        sections = [s.to_internal() for s in request.sections]
        assignments = [a.to_internal() for a in request.assignments]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid input data: {str(e)}")

    try:
        schedule = solve_timetable(
            timeslots=timeslots,
            rooms=rooms,
            faculty=faculty,
            courses=courses,
            sections=sections,
            assignments=assignments
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Solver error: {str(e)}")
        
    if not schedule:
        return TimetableResponse(
            status="INFEASIBLE",
            message="No feasible schedule could be found with the given constraints.",
            schedule=[],
            is_valid=False,
            errors=["Infeasible scheduling problem."],
            metrics=None
        )
        
    # Validate and calculate metrics
    is_valid, errors = validate_timetable(schedule, timeslots, rooms, faculty, courses, sections, assignments)
    internal_metrics = calculate_metrics(schedule, timeslots, rooms, faculty, courses, sections, assignments)
    
    # Convert back to API schemas
    api_schedule = [ScheduledClassSchema.from_internal(sc) for sc in schedule]
    api_metrics = ScheduleMetricsSchema.from_internal(internal_metrics)
    
    return TimetableResponse(
        status="SUCCESS",
        message="Optimal schedule generated successfully.",
        schedule=api_schedule,
        is_valid=is_valid,
        errors=errors,
        metrics=api_metrics
    )

@router.post("/validate", response_model=TimetableResponse)
def validate_existing_timetable(request: ValidateRequest):
    try:
        timeslots = [t.to_internal() for t in request.timeslots]
        rooms = [r.to_internal() for r in request.rooms]
        faculty = [f.to_internal() for f in request.faculty]
        courses = [c.to_internal() for c in request.courses]
        sections = [s.to_internal() for s in request.sections]
        assignments = [a.to_internal() for a in request.assignments]
        schedule = [sc.to_internal() for sc in request.schedule]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid input data: {str(e)}")
        
    try:
        is_valid, errors = validate_timetable(schedule, timeslots, rooms, faculty, courses, sections, assignments)
        internal_metrics = calculate_metrics(schedule, timeslots, rooms, faculty, courses, sections, assignments)
        api_metrics = ScheduleMetricsSchema.from_internal(internal_metrics)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Validation error: {str(e)}")
        
    return TimetableResponse(
        status="VALIDATED",
        message="Timetable validation complete.",
        schedule=request.schedule,
        is_valid=is_valid,
        errors=errors,
        metrics=api_metrics
    )

@router.post("/reoptimize", response_model=TimetableResponse)
def reoptimize_timetable(request: GenerateRequest):
    """
    Accepts existing scheduling data plus changed constraints (like faculty availability).
    Re-runs the existing optimization engine and returns the updated timetable.
    """
    return generate_timetable(request)

@router.post("/generate-db", response_model=TimetableResponse)
def generate_timetable_from_db(schedule_name: str = Query("Generated Schedule", description="Name of the generated schedule")):
    """
    Loads scheduling data from the PostgreSQL database, runs the OR-Tools solver,
    saves the generated timetable back to the database as the active schedule,
    and returns the result.
    """
    try:
        timeslots, rooms, faculty, courses, sections, assignments = get_scheduler_input()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database retrieval error: {str(e)}"
        )

    try:
        schedule = solve_timetable(
            timeslots=timeslots,
            rooms=rooms,
            faculty=faculty,
            courses=courses,
            sections=sections,
            assignments=assignments
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Solver error: {str(e)}"
        )
        
    if not schedule:
        return TimetableResponse(
            status="INFEASIBLE",
            message="No feasible schedule could be found with the given constraints.",
            schedule=[],
            is_valid=False,
            errors=["Infeasible scheduling problem."],
            metrics=None
        )
        
    # Validate and calculate metrics
    is_valid, errors = validate_timetable(schedule, timeslots, rooms, faculty, courses, sections, assignments)
    internal_metrics = calculate_metrics(schedule, timeslots, rooms, faculty, courses, sections, assignments)
    
    # Save the schedule to the database
    try:
        save_schedule(schedule_name, schedule)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database save error: {str(e)}"
        )
        
    # Convert back to API schemas
    api_schedule = [ScheduledClassSchema.from_internal(sc) for sc in schedule]
    api_metrics = ScheduleMetricsSchema.from_internal(internal_metrics)
    
    return TimetableResponse(
        status="SUCCESS",
        message="Optimal schedule generated and saved to database successfully.",
        schedule=api_schedule,
        is_valid=is_valid,
        errors=errors,
        metrics=api_metrics
    )

@router.post("/generate-semester", response_model=TimetableResponse)
def generate_timetable_for_semester(request: GenerateSemesterRequest, schedule_name: str = Query("Semester Schedule", description="Name of the generated schedule")):
    """
    Generates a timetable for a single, isolated semester using the hierarchical data model.
    Expands lab batches, runs the CP-SAT solver with contiguous lab blocks, and saves the schedule.
    """
    try:
        timeslots, rooms, faculty, courses, sections, assignments, student_counts = prepare_semester_input(request.semester_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database retrieval or orchestration error: {str(e)}"
        )

    try:
        schedule = solve_timetable(
            timeslots=timeslots,
            rooms=rooms,
            faculty=faculty,
            courses=courses,
            sections=sections,
            assignments=assignments,
            assignment_student_counts=student_counts
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Solver error: {str(e)}"
        )
        
    if not schedule:
        return TimetableResponse(
            status="INFEASIBLE",
            message="No feasible schedule could be found with the given constraints for this semester.",
            schedule=[],
            is_valid=False,
            errors=["Infeasible scheduling problem."],
            metrics=None
        )
        
    # Validate and calculate metrics
    is_valid, errors = validate_timetable(
        schedule, timeslots, rooms, faculty, courses, sections, assignments, student_counts
    )
    internal_metrics = calculate_metrics(
        schedule, timeslots, rooms, faculty, courses, sections, assignments, student_counts
    )
    
    # Save the schedule to the database, explicitly linking to the semester
    try:
        save_schedule(schedule_name, schedule, semester_id=request.semester_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database save error: {str(e)}"
        )
        
    # Convert back to API schemas
    api_schedule = [ScheduledClassSchema.from_internal(sc) for sc in schedule]
    api_metrics = ScheduleMetricsSchema.from_internal(internal_metrics)
    
    return TimetableResponse(
        status="SUCCESS" if is_valid else "VALIDATION_FAILED",
        message="Optimal schedule generated successfully." if is_valid else "Schedule generated but failed validation.",
        schedule=api_schedule,
        is_valid=is_valid,
        errors=errors,
        metrics=api_metrics
    )

@router.get("/active", response_model=List[ScheduledClassSchema])
def get_active_timetable():
    """
    Retrieves the currently active timetable from the database.
    """
    try:
        schedule = get_active_schedule()
        return [ScheduledClassSchema.from_internal(sc) for sc in schedule]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database retrieval error: {str(e)}"
        )

