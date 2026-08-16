from dataclasses import dataclass, field
from typing import List, Set, Optional

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

@dataclass
class Faculty:
    id: str
    name: str
    available_timeslots: Set[int] = field(default_factory=set)

@dataclass
class Course:
    id: str
    name: str
    requires_lab: bool

@dataclass
class Section:
    id: str
    name: str
    student_count: int

@dataclass
class CourseAssignment:
    """
    Represents the requirement for a Section to take a Course 
    taught by a Faculty for a certain number of weekly periods.
    """
    id: str
    section_id: str
    course_id: str
    faculty_id: str
    weekly_periods: int

@dataclass
class ScheduledClass:
    """Output model representing a scheduled class meeting."""
    assignment_id: str
    period_idx: int
    timeslot_id: int
    room_id: str
