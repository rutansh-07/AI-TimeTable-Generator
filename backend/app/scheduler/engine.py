from ortools.sat.python import cp_model
from typing import List
from .models import ScheduledClass, TimeSlot, Room, Faculty, Course, Section, CourseAssignment
from .constraints import apply_constraints
from .objectives import apply_soft_objectives

class Meeting:
    """Internal class to represent an individual period of a CourseAssignment."""
    def __init__(self, id: str, assignment: CourseAssignment, period_idx: int):
        self.id = id
        self.assignment = assignment
        self.period_idx = period_idx

def solve_timetable(
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section],
    assignments: List[CourseAssignment]
) -> List[ScheduledClass]:
    """
    Sets up the CP-SAT model and solves for the timetable.
    Returns a list of ScheduledClass on success, or an empty list on failure.
    """
    model = cp_model.CpModel()
    
    # 1. Expand assignments into individual meetings
    meetings = []
    mid = 0
    for a in assignments:
        for p in range(a.weekly_periods):
            meetings.append(Meeting(f"M{mid}", a, p))
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
                                room_id=r.id
                            )
                        )
        return scheduled_classes
    else:
        return []
