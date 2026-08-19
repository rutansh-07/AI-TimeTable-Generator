"""
Pydantic API schemas for the CredWeave AI Timetable Generator.

All original schemas are fully preserved for backward compatibility.
New schemas for the hierarchical academic model are added below the
existing ones. They are used by the data layer and future API endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Set, Optional
from app.scheduler import models as internal_models

# ─────────────────────────────────────────────────────────────────────────────
# ORIGINAL SCHEMAS (preserved — solver endpoints use these unchanged)
# ─────────────────────────────────────────────────────────────────────────────

class TimeSlotSchema(BaseModel):
    id: int
    day: str
    time: str

    def to_internal(self) -> internal_models.TimeSlot:
        return internal_models.TimeSlot(id=self.id, day=self.day, time=self.time)


class RoomSchema(BaseModel):
    id: str
    name: str
    capacity: int
    is_lab: bool
    # Optional enriched field; solver ignores it, API may use it for filtering
    room_type: str = ""

    def to_internal(self) -> internal_models.Room:
        return internal_models.Room(
            id=self.id,
            name=self.name,
            capacity=self.capacity,
            is_lab=self.is_lab,
            room_type=self.room_type,
        )


class FacultySchema(BaseModel):
    id: str
    name: str
    available_timeslots: Set[int] = Field(default_factory=set)
    preferred_timeslots: Set[int] = Field(default_factory=set)
    department_id: str = ""

    def to_internal(self) -> internal_models.Faculty:
        return internal_models.Faculty(
            id=self.id,
            name=self.name,
            available_timeslots=self.available_timeslots,
            preferred_timeslots=self.preferred_timeslots,
            department_id=self.department_id,
        )


class CourseSchema(BaseModel):
    id: str
    name: str
    requires_lab: bool
    course_code: str = ""
    credits: int = 0
    course_type: str = "theory"
    weekly_hours: int = 0
    semester_id: str = ""
    department_id: str = ""
    is_elective: bool = False

    def to_internal(self) -> internal_models.Course:
        return internal_models.Course(
            id=self.id,
            name=self.name,
            requires_lab=self.requires_lab,
            course_code=self.course_code,
            credits=self.credits,
            course_type=self.course_type,
            weekly_hours=self.weekly_hours,
            semester_id=self.semester_id,
            department_id=self.department_id,
            is_elective=self.is_elective,
        )


class SectionSchema(BaseModel):
    id: str
    name: str
    student_count: int
    semester_id: str = ""
    department_id: str = ""
    section_code: str = ""

    def to_internal(self) -> internal_models.Section:
        return internal_models.Section(
            id=self.id,
            name=self.name,
            student_count=self.student_count,
            semester_id=self.semester_id,
            department_id=self.department_id,
            section_code=self.section_code,
        )


class CourseAssignmentSchema(BaseModel):
    id: str
    section_id: str
    course_id: str
    faculty_id: str
    weekly_periods: int
    elective_group_id: str = ""
    lab_batch_id: str = ""

    def to_internal(self) -> internal_models.CourseAssignment:
        return internal_models.CourseAssignment(
            id=self.id,
            section_id=self.section_id,
            course_id=self.course_id,
            faculty_id=self.faculty_id,
            weekly_periods=self.weekly_periods,
            elective_group_id=self.elective_group_id,
            lab_batch_id=self.lab_batch_id,
        )


class ScheduledClassSchema(BaseModel):
    assignment_id: str
    period_idx: int
    timeslot_id: int
    room_id: str

    def to_internal(self) -> internal_models.ScheduledClass:
        return internal_models.ScheduledClass(
            assignment_id=self.assignment_id,
            period_idx=self.period_idx,
            timeslot_id=self.timeslot_id,
            room_id=self.room_id,
        )

    @classmethod
    def from_internal(cls, obj: internal_models.ScheduledClass):
        return cls(
            assignment_id=obj.assignment_id,
            period_idx=obj.period_idx,
            timeslot_id=obj.timeslot_id,
            room_id=obj.room_id,
        )


class ScheduleMetricsSchema(BaseModel):
    total_gaps: int
    faculty_imbalance: int
    room_utilization_penalty: int
    preference_violations: int
    total_penalty: int
    quality_score: int

    @classmethod
    def from_internal(cls, obj: internal_models.ScheduleMetrics):
        return cls(
            total_gaps=obj.total_gaps,
            faculty_imbalance=obj.faculty_imbalance,
            room_utilization_penalty=obj.room_utilization_penalty,
            preference_violations=obj.preference_violations,
            total_penalty=obj.total_penalty,
            quality_score=obj.quality_score,
        )


class GenerateRequest(BaseModel):
    timeslots: List[TimeSlotSchema]
    rooms: List[RoomSchema]
    faculty: List[FacultySchema]
    courses: List[CourseSchema]
    sections: List[SectionSchema]
    assignments: List[CourseAssignmentSchema]


class ValidateRequest(GenerateRequest):
    schedule: List[ScheduledClassSchema]


class TimetableResponse(BaseModel):
    status: str
    message: str
    schedule: List[ScheduledClassSchema]
    is_valid: bool
    errors: List[str]
    metrics: Optional[ScheduleMetricsSchema] = None


# ─────────────────────────────────────────────────────────────────────────────
# NEW HIERARCHICAL SCHEMAS (CredWeave NEP 2020 Academic Model)
# Used by data layer, admin API endpoints, and future orchestration.
# NOT yet wired into the CP-SAT solver core.
# ─────────────────────────────────────────────────────────────────────────────

class SemesterSchema(BaseModel):
    id: str
    semester_number: int
    name: str
    academic_year: str
    is_active: bool = False

    def to_internal(self) -> internal_models.Semester:
        return internal_models.Semester(
            id=self.id,
            semester_number=self.semester_number,
            name=self.name,
            academic_year=self.academic_year,
            is_active=self.is_active,
        )


class DepartmentSchema(BaseModel):
    id: str
    code: str
    name: str

    def to_internal(self) -> internal_models.Department:
        return internal_models.Department(
            id=self.id,
            code=self.code,
            name=self.name,
        )


class LabBatchSchema(BaseModel):
    id: str
    section_id: str
    batch_code: str
    student_count: int

    def to_internal(self) -> internal_models.LabBatch:
        return internal_models.LabBatch(
            id=self.id,
            section_id=self.section_id,
            batch_code=self.batch_code,
            student_count=self.student_count,
        )


class StudentSchema(BaseModel):
    id: str
    roll_number: str
    name: str
    section_id: str
    semester_id: str
    lab_batch_id: str = ""

    def to_internal(self) -> internal_models.Student:
        return internal_models.Student(
            id=self.id,
            roll_number=self.roll_number,
            name=self.name,
            section_id=self.section_id,
            semester_id=self.semester_id,
            lab_batch_id=self.lab_batch_id,
        )


class ElectiveGroupSchema(BaseModel):
    id: str
    semester_id: str
    course_id: str
    name: str
    capacity: int
    enrolled_count: int = 0

    def to_internal(self) -> internal_models.ElectiveGroup:
        return internal_models.ElectiveGroup(
            id=self.id,
            semester_id=self.semester_id,
            course_id=self.course_id,
            name=self.name,
            capacity=self.capacity,
            enrolled_count=self.enrolled_count,
        )


# ─────────────────────────────────────────────────────────────────────────────
# INSTITUTIONAL DATA SUMMARY RESPONSE
# Used by future /api/hierarchy/{semester_id} endpoints.
# ─────────────────────────────────────────────────────────────────────────────

class HierarchySummaryResponse(BaseModel):
    semester: SemesterSchema
    departments: List[DepartmentSchema]
    sections: List[SectionSchema]
    lab_batches: List[LabBatchSchema]
    courses: List[CourseSchema]
    faculty_count: int
    total_students: int
    elective_groups: List[ElectiveGroupSchema]
    data_classification: str = "SYNTHETIC/DEMO — Not live institutional data"
