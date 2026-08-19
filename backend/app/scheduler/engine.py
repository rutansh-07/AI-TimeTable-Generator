from ortools.sat.python import cp_model
from typing import List
from .models import ScheduledClass, TimeSlot, Room, Faculty, Course, Section, CourseAssignment
from .constraints import apply_constraints
from .objectives import apply_soft_objectives

class Meeting:
    """Internal class to represent an individual period of a CourseAssignment."""
    def __init__(self, id: str, assignment: CourseAssignment, period_idx: int, is_lab: bool = False, effective_student_count: int = 0):
        self.id = id
        self.assignment = assignment
        self.period_idx = period_idx
        self.is_lab = is_lab
        self.effective_student_count = effective_student_count

def solve_timetable(
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section],
    assignments: List[CourseAssignment],
    assignment_student_counts: dict = None
) -> List[ScheduledClass]:
    """
    Sets up the CP-SAT model and solves for the timetable.
    Returns a list of ScheduledClass on success, or an empty list on failure.
    """
    if assignment_student_counts is None:
        assignment_student_counts = {}
        
    course_map = {c.id: c for c in courses}
    section_map = {s.id: s for s in sections}
    model = cp_model.CpModel()
    
    # 1. Expand assignments into individual meetings
    meetings = []
    mid = 0
    for a in assignments:
        c = course_map[a.course_id]
        s = section_map[a.section_id]
        effective_count = assignment_student_counts.get(a.id, s.student_count)
        
        for p in range(a.weekly_periods):
            meetings.append(Meeting(f"M{mid}", a, p, is_lab=c.requires_lab, effective_student_count=effective_count))
            mid += 1
            
    # 2. Create Variables
    # x[m.id, t.id, r.id] is 1 if meeting m is in timeslot t and room r
    x = {}
    for m in meetings:
        for t in timeslots:
            for r in rooms:
                x[(m.id, t.id, r.id)] = model.NewBoolVar(f"x_{m.id}_{t.id}_{r.id}")
                
    # 3. Apply Constraints
    apply_constraints(model, x, meetings, timeslots, rooms, faculty, courses, sections)
    
    # 3.5 Apply Soft Objectives
    apply_soft_objectives(model, x, meetings, timeslots, rooms, faculty, courses, sections)
    
    # 4. Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    # solver.parameters.log_search_progress = True # Optional logging
    status = solver.Solve(model)
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        scheduled_classes = []
        for m in meetings:
            for t in timeslots:
                for r in rooms:
                    if solver.Value(x[(m.id, t.id, r.id)]) == 1:
                        scheduled_classes.append(
                            ScheduledClass(
                                assignment_id=m.assignment.id,
                                period_idx=m.period_idx,
                                timeslot_id=t.id,
                                room_id=r.id,
                                database_assignment_id=m.assignment.database_assignment_id,
                                lab_batch_id=m.assignment.lab_batch_id
                            )
                        )
        return scheduled_classes
    else:
        return []
