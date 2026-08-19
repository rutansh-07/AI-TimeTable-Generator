"""
Core data models for the CredWeave AI Timetable Generator.

HIERARCHICAL ACADEMIC MODEL (CredWeave NEP 2020):
  Semester
    └── Department
         └── Section
              └── LabBatch (A, B, C, D)
                   └── Student

  Semester
    └── Course
         └── CourseAssignment (Section / ElectiveGroup + Faculty)

  ElectiveGroup
    └── cross-department enrolled students

BACKWARD COMPATIBILITY:
  The original flat models (TimeSlot, Room, Faculty, Course, Section,
  CourseAssignment, ScheduledClass, ScheduleMetrics) are fully preserved.
  The solver engine continues to work unchanged.

  The new hierarchical models are additive and are used by the data layer
  and API orchestration. They are NOT yet wired into the CP-SAT solver
  (that belongs to Step 2 of the MVP roadmap).

DATA CLASSIFICATION (per CredWeave Audit):
  All seed data derived from these models is SYNTHETIC/DEMO data based on
  the institutional specification documented in the project. It is NOT
  live institutional data.
"""

from dataclasses import dataclass, field
from typing import List, Set, Optional

# ─────────────────────────────────────────────────────────────────────────────
# ORIGINAL FLAT MODELS (preserved for full backward compatibility)
# The CP-SAT solver engine.py uses only these.
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TimeSlot:
    id: int
    day: str
    time: str

    def __str__(self):
        return f"{self.day} {self.time}"


@dataclass
class Room:
    id: str
    name: str
    capacity: int
    is_lab: bool
    # room_type is an optional enriched field for hierarchical queries.
    # Values: "lecture", "lab", "hall"
    # Defaults to "lab" if is_lab=True, otherwise "lecture".
    room_type: str = ""

    def __post_init__(self):
        if not self.room_type:
            self.room_type = "lab" if self.is_lab else "lecture"


@dataclass
class Faculty:
    id: str
    name: str
    available_timeslots: Set[int] = field(default_factory=set)
    preferred_timeslots: Set[int] = field(default_factory=set)
    # Optional: department link for filtering (not used by solver)
    department_id: str = ""


@dataclass
class Course:
    id: str
    name: str
    requires_lab: bool
    # Extended fields for hierarchical model.
    # Defaults preserve backward compatibility for the sandbox solver.
    course_code: str = ""
    credits: int = 0
    # "theory" or "practical"
    course_type: str = "theory"
    weekly_hours: int = 0
    semester_id: str = ""
    department_id: str = ""
    is_elective: bool = False

    def __post_init__(self):
        if not self.course_code:
            self.course_code = self.id
        if not self.weekly_hours:
            self.weekly_hours = 2 if self.requires_lab else 3


@dataclass
class Section:
    id: str
    name: str
    student_count: int
    # Extended fields for hierarchical model.
    # Defaults preserve backward compatibility for the sandbox solver.
    semester_id: str = ""
    department_id: str = ""
    section_code: str = ""

    def __post_init__(self):
        if not self.section_code:
            self.section_code = self.name


@dataclass
class CourseAssignment:
    """
    Represents the requirement for a Section (or ElectiveGroup) to take a
    Course taught by a Faculty for a certain number of weekly periods.
    """
    id: str
    section_id: str
    course_id: str
    faculty_id: str
    weekly_periods: int
    # Optional: elective_group_id when the assignment targets a cross-department
    # elective cohort instead of a regular section. Used in orchestration only.
    elective_group_id: str = ""
    # Optional: lab_batch_id when the assignment targets a specific batch.
    # Used in orchestration only (Step 2+).
    lab_batch_id: str = ""
    # Optional: preserves the original course_assignments.id from the database
    # when the scheduler expands lab assignments into batch-specific IDs.
    # Used only for database persistence. Defaults to None (fallback to self.id).
    database_assignment_id: Optional[str] = None


@dataclass
class ScheduledClass:
    """Output model representing a scheduled class meeting."""
    assignment_id: str
    period_idx: int
    timeslot_id: int
    room_id: str
    # Optional: the original course_assignments.id for database persistence.
    # When None, assignment_id is used directly (backward compatibility).
    database_assignment_id: Optional[str] = None
    # Optional: the lab_batch_id for batch-specific practical assignments.
    lab_batch_id: Optional[str] = None


@dataclass
class ScheduleMetrics:
    """Output model representing the quality metrics of a schedule."""
    total_gaps: int
    faculty_imbalance: int
    room_utilization_penalty: int
    preference_violations: int
    total_penalty: int
    quality_score: int


# ─────────────────────────────────────────────────────────────────────────────
# HIERARCHICAL MODELS (New — CredWeave NEP 2020 Academic Structure)
# Used by database layer, API orchestration, and future solver steps.
# NOT yet wired into the CP-SAT solver core.
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Semester:
    """
    Represents an academic semester.
    MVP supports semester_number 1 through 5.

    DATA NOTE: Synthetic/Demo data. Not live institutional data.
    """
    id: str
    semester_number: int        # 1, 2, 3, 4, 5
    name: str                   # e.g. "Semester 5"
    academic_year: str          # e.g. "2026-27"
    is_active: bool = False


@dataclass
class Department:
    """
    Represents an academic department.
    Verified institutional codes: CE, CSE, IT.
    """
    id: str
    code: str          # "CE", "CSE", "IT"
    name: str          # e.g. "Computer Engineering"


@dataclass
class LabBatch:
    """
    Represents a lab batch within a section.

    One section of ~84 students is divided into 4 lab batches (A, B, C, D).
    Each batch has ~21 students for laboratory sessions.

    DATA NOTE: Batch sizes are synthetic estimates based on project specification
    (84 students / 4 batches ≈ 21 per batch).
    """
    id: str
    section_id: str
    batch_code: str    # "A", "B", "C", "D"
    student_count: int


@dataclass
class Student:
    """
    Represents a student enrolled in the institution.

    DATA NOTE: Student records in seed data are SYNTHETIC placeholders.
    Exact student roll numbers and elective choices are NOT verified
    institutional data.
    """
    id: str
    roll_number: str
    name: str
    section_id: str
    semester_id: str
    lab_batch_id: str = ""   # Assigned lab batch within the section


@dataclass
class ElectiveGroup:
    """
    Represents a cross-department elective cohort.

    Students from CE, CSE, and IT may enrol in the same elective.
    If total enrolment exceeds room capacity, the elective is split into
    multiple ElectiveGroup instances (Group 1, Group 2, ...).

    DATA NOTE: Elective group composition is SYNTHETIC for the MVP seed.
    """
    id: str
    semester_id: str
    course_id: str
    name: str              # e.g. "Cyber Security - Group 1"
    capacity: int          # max students for this group's room
    enrolled_count: int = 0
