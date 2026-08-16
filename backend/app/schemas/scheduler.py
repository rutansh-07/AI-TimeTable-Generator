from pydantic import BaseModel, Field
from typing import List, Set, Optional
from app.scheduler import models as internal_models

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
    
    def to_internal(self) -> internal_models.Room:
        return internal_models.Room(id=self.id, name=self.name, capacity=self.capacity, is_lab=self.is_lab)

class FacultySchema(BaseModel):
    id: str
    name: str
    available_timeslots: Set[int] = Field(default_factory=set)
    preferred_timeslots: Set[int] = Field(default_factory=set)
    
    def to_internal(self) -> internal_models.Faculty:
        return internal_models.Faculty(
            id=self.id, name=self.name, 
            available_timeslots=self.available_timeslots, 
            preferred_timeslots=self.preferred_timeslots
        )

class CourseSchema(BaseModel):
    id: str
    name: str
    requires_lab: bool
    
    def to_internal(self) -> internal_models.Course:
        return internal_models.Course(id=self.id, name=self.name, requires_lab=self.requires_lab)

class SectionSchema(BaseModel):
    id: str
    name: str
    student_count: int
    
    def to_internal(self) -> internal_models.Section:
        return internal_models.Section(id=self.id, name=self.name, student_count=self.student_count)

class CourseAssignmentSchema(BaseModel):
    id: str
    section_id: str
    course_id: str
    faculty_id: str
    weekly_periods: int
    
    def to_internal(self) -> internal_models.CourseAssignment:
        return internal_models.CourseAssignment(
            id=self.id, section_id=self.section_id, course_id=self.course_id, 
            faculty_id=self.faculty_id, weekly_periods=self.weekly_periods
        )

class ScheduledClassSchema(BaseModel):
    assignment_id: str
    period_idx: int
    timeslot_id: int
    room_id: str
    
    def to_internal(self) -> internal_models.ScheduledClass:
        return internal_models.ScheduledClass(
            assignment_id=self.assignment_id, period_idx=self.period_idx, 
            timeslot_id=self.timeslot_id, room_id=self.room_id
        )

    @classmethod
    def from_internal(cls, obj: internal_models.ScheduledClass):
        return cls(
            assignment_id=obj.assignment_id, period_idx=obj.period_idx, 
            timeslot_id=obj.timeslot_id, room_id=obj.room_id
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
            quality_score=obj.quality_score
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
