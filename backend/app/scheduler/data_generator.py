from typing import Tuple, List, Dict
from .models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment

def generate_test_data() -> Tuple[List[TimeSlot], List[Room], List[Faculty], List[Course], List[Section], List[CourseAssignment]]:
    """
    Generates a deliberately testable dataset that exercises all 7 hard constraints:
    - faculty availability restriction
    - lab course requiring a lab
    - different room capacities
    - multiple sections
    - courses requiring multiple weekly periods
    """
    
    # 1. Generate Timeslots (2 days, 3 slots per day = 6 slots)
    days = ["Monday", "Tuesday"]
    times = ["09:00", "11:00", "14:00"]
    timeslots = []
    tid = 0
    for day in days:
        for t in times:
            timeslots.append(TimeSlot(id=tid, day=day, time=t))
            tid += 1
            
    # 2. Generate Rooms (Different capacities, one lab)
    rooms = [
        Room(id="R1", name="Room 101", capacity=30, is_lab=False),
        Room(id="R2", name="Lecture Hall", capacity=100, is_lab=False),
        Room(id="L1", name="Computer Lab", capacity=40, is_lab=True)
    ]
    
    # 3. Generate Courses (One lab course, different period requirements)
    courses = [
        Course(id="C1", name="Intro to CS", requires_lab=True), # Lab required
        Course(id="C2", name="Calculus I", requires_lab=False),
        Course(id="C3", name="Physics I", requires_lab=False)
    ]
    
    # 4. Generate Sections (Different sizes)
    sections = [
        Section(id="S1", name="Section A", student_count=25), # Fits in all rooms
        Section(id="S2", name="Section B", student_count=50)  # Only fits in Lecture Hall
    ]
    
    # 5. Generate Faculty (One with limited availability)
    # Total slots = 6. F1 is available all the time.
    # F2 is only available on Monday (slots 0, 1, 2).
    faculty = [
        Faculty(id="F1", name="Dr. Smith", available_timeslots={0, 1, 2, 3, 4, 5}),
        Faculty(id="F2", name="Dr. Jones", available_timeslots={0, 1, 2}), # Availability restriction
        Faculty(id="F3", name="Dr. Brown", available_timeslots={0, 1, 2, 3, 4, 5})
    ]
    
    # 6. Generate Assignments (Requirements)
    assignments = [
        # S1 takes CS (needs lab, 2 periods) with F2 (limited availability)
        CourseAssignment(id="A1", section_id="S1", course_id="C1", faculty_id="F2", weekly_periods=2),
        
        # S1 takes Calculus (2 periods) with F1
        CourseAssignment(id="A2", section_id="S1", course_id="C2", faculty_id="F1", weekly_periods=2),
        
        # S2 takes Calculus (2 periods) with F1
        CourseAssignment(id="A3", section_id="S2", course_id="C2", faculty_id="F1", weekly_periods=2),
        
        # S2 takes Physics (2 periods) with F3
        CourseAssignment(id="A4", section_id="S2", course_id="C3", faculty_id="F3", weekly_periods=2)
    ]
    
    return timeslots, rooms, faculty, courses, sections, assignments
