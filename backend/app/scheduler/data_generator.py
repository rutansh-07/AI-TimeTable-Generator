from typing import Tuple, List, Dict
from .models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment

def generate_test_data() -> Tuple[List[TimeSlot], List[Room], List[Faculty], List[Course], List[Section], List[CourseAssignment]]:
    # 1. Generate Timeslots (3 days, 4 slots = 12 slots)
    days = ["Monday", "Tuesday", "Wednesday"]
    times = ["09:00", "11:00", "13:00", "15:00"]
    timeslots = []
    tid = 0
    for day in days:
        for t in times:
            timeslots.append(TimeSlot(id=tid, day=day, time=t))
            tid += 1
            
    # 2. Generate Rooms (Different capacities, one lab)
    rooms = [
        Room(id="R1", name="Small Room", capacity=30, is_lab=False),
        Room(id="R2", name="Medium Room", capacity=60, is_lab=False),
        Room(id="R3", name="Lecture Hall", capacity=120, is_lab=False),
        Room(id="L1", name="Computer Lab", capacity=40, is_lab=True)
    ]
    
    # 3. Generate Courses
    courses = [
        Course(id="C1", name="Intro to CS", requires_lab=True),
        Course(id="C2", name="Calculus I", requires_lab=False),
        Course(id="C3", name="Physics I", requires_lab=False)
    ]
    
    # 4. Generate Sections (Different sizes to test room utilization)
    sections = [
        Section(id="S1", name="Section A", student_count=25), # Fits anywhere
        Section(id="S2", name="Section B", student_count=55), # Needs Medium or Lecture Hall
        Section(id="S3", name="Section C", student_count=100) # Needs Lecture Hall
    ]
    
    # 5. Generate Faculty with preferences
    all_slots = set(range(12))
    faculty = [
        Faculty(id="F1", name="Dr. Smith", available_timeslots=all_slots, preferred_timeslots={0, 1, 4, 5, 8, 9}), # Prefers morning slots
        Faculty(id="F2", name="Dr. Jones", available_timeslots={0, 1, 2, 3, 4, 5, 6, 7}, preferred_timeslots={0, 1, 4, 5}), # Not available wednesday
        Faculty(id="F3", name="Dr. Brown", available_timeslots=all_slots, preferred_timeslots={2, 3, 6, 7, 10, 11}) # Prefers afternoon slots
    ]
    
    # 6. Generate Assignments (Requirements)
    assignments = [
        CourseAssignment(id="A1", section_id="S1", course_id="C1", faculty_id="F2", weekly_periods=2), # Lab
        CourseAssignment(id="A2", section_id="S1", course_id="C2", faculty_id="F1", weekly_periods=2),
        CourseAssignment(id="A3", section_id="S2", course_id="C2", faculty_id="F1", weekly_periods=3),
        CourseAssignment(id="A4", section_id="S3", course_id="C3", faculty_id="F3", weekly_periods=3)
    ]
    
    return timeslots, rooms, faculty, courses, sections, assignments
