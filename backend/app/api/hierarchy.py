from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.schemas.scheduler import (
    SemesterSchema, GenerateRequest, TimeSlotSchema, RoomSchema,
    FacultySchema, CourseSchema, SectionSchema, CourseAssignmentSchema
)
from app.db.connection import get_semesters, get_semester_hierarchy_summary
from app.scheduler.orchestrator import prepare_semester_input

router = APIRouter()

@router.get("/semesters", response_model=List[SemesterSchema])
def list_semesters():
    """
    Returns all academic semesters from the database ordered by semester_number.
    """
    try:
        semesters = get_semesters()
        return [
            SemesterSchema(
                id=s.id,
                semester_number=s.semester_number,
                name=s.name,
                academic_year=s.academic_year,
                is_active=s.is_active,
            )
            for s in semesters
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching semesters: {str(e)}"
        )

@router.get("/{semester_id}")
def get_hierarchy_for_semester(semester_id: str):
    """
    Returns the full hierarchy summary for a specific semester.
    """
    try:
        summary = get_semester_hierarchy_summary(semester_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching hierarchy summary: {str(e)}"
        )

@router.get("/{semester_id}/data", response_model=GenerateRequest)
def get_semester_scheduling_data(semester_id: str):
    """
    Returns the normalized scheduling input (GenerateRequest) for a specific semester,
    including expanded lab batches, so the frontend grid and inspector have all metadata.
    """
    try:
        timeslots, rooms, faculty, courses, sections, assignments, _ = prepare_semester_input(semester_id)
        return GenerateRequest(
            timeslots=[TimeSlotSchema(id=t.id, day=t.day, time=t.time) for t in timeslots],
            rooms=[
                RoomSchema(
                    id=r.id, name=r.name, capacity=r.capacity,
                    is_lab=r.is_lab, room_type=r.room_type
                )
                for r in rooms
            ],
            faculty=[
                FacultySchema(
                    id=f.id, name=f.name,
                    available_timeslots=list(f.available_timeslots),
                    preferred_timeslots=list(f.preferred_timeslots),
                    department_id=f.department_id
                )
                for f in faculty
            ],
            courses=[
                CourseSchema(
                    id=c.id, name=c.name, requires_lab=c.requires_lab,
                    course_code=c.course_code, credits=c.credits,
                    course_type=c.course_type, weekly_hours=c.weekly_hours,
                    semester_id=c.semester_id, department_id=c.department_id,
                    is_elective=c.is_elective
                )
                for c in courses
            ],
            sections=[
                SectionSchema(
                    id=s.id, name=s.name, student_count=s.student_count,
                    semester_id=s.semester_id, department_id=s.department_id,
                    section_code=s.section_code
                )
                for s in sections
            ],
            assignments=[
                CourseAssignmentSchema(
                    id=a.id, section_id=a.section_id, course_id=a.course_id,
                    faculty_id=a.faculty_id, weekly_periods=a.weekly_periods,
                    elective_group_id=a.elective_group_id,
                    lab_batch_id=a.lab_batch_id
                )
                for a in assignments
            ],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching semester data: {str(e)}"
        )

@router.get("/{semester_id}/faculty")
def get_faculty_for_semester(semester_id: str):
    """
    Returns detailed teaching allocation and schedule info for faculty in a semester.
    Supports read-only Faculty View (Step 4B).
    """
    try:
        from app.db.connection import get_semester_faculty_details, get_db_cursor
        faculty_data = get_semester_faculty_details(semester_id)
        with get_db_cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS cnt FROM faculty;")
            total_inst_fac = cursor.fetchone()['cnt']
        return {
            "semester_id": semester_id,
            "total_assigned_faculty": len(faculty_data),
            "total_institutional_faculty": total_inst_fac,
            "faculty": faculty_data,
            "data_classification": "VERIFIED FROM DATABASE — Semester teaching allocations",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching faculty details: {str(e)}"
        )

@router.get("/{semester_id}/students")
def get_students_for_semester(semester_id: str):
    """
    Returns detailed student list, lab batch info, elective enrollment, and curriculum for a semester.
    Supports read-only Student View (Step 4B).
    """
    try:
        from app.db.connection import get_semester_student_details, get_db_cursor
        student_data = get_semester_student_details(semester_id)
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(SUM(student_count), 0) AS cnt FROM sections WHERE semester_id = %s;",
                (semester_id,)
            )
            cohort_count = cursor.fetchone()['cnt']
        return {
            "semester_id": semester_id,
            "cohort_student_count": cohort_count,
            "total_registered_students": len(student_data),
            "students": student_data,
            "data_classification": "SYNTHETIC SEED DATA — 60 representative student records out of 504 section cohort capacity for SEM5",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching student details: {str(e)}"
        )


