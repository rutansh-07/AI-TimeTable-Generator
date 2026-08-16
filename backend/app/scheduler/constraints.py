from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment

def apply_constraints(
    model: cp_model.CpModel,
    x: Dict[tuple, Any],
    meetings: List[Any],
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section]
):
    """
    Applies the 7 hard constraints to the OR-Tools model.
    x is a dict mapping (meeting_id, timeslot_id, room_id) -> BoolVar.
    """
    
    # Helper lookups
    section_map = {s.id: s for s in sections}
    faculty_map = {f.id: f for f in faculty}
    course_map = {c.id: c for c in courses}
    
    # 0. Each meeting must be scheduled exactly once
    for m in meetings:
        model.AddExactlyOne(x[(m.id, t.id, r.id)] for t in timeslots for r in rooms)
        
    # 1. No faculty clash & 2. No section clash & 3. No room clash
    for t in timeslots:
        # Room clash
        for r in rooms:
            model.AddAtMostOne(x[(m.id, t.id, r.id)] for m in meetings)
            
        # Faculty clash
        for f in faculty:
            f_meetings = [m for m in meetings if m.assignment.faculty_id == f.id]
            model.AddAtMostOne(x[(m.id, t.id, r.id)] for m in f_meetings for r in rooms)
            
        # Section clash
        for s in sections:
            s_meetings = [m for m in meetings if m.assignment.section_id == s.id]
            model.AddAtMostOne(x[(m.id, t.id, r.id)] for m in s_meetings for r in rooms)

    # 4. Room capacity, 5. Faculty availability, 6. Lab requirement
    for m in meetings:
        s = section_map[m.assignment.section_id]
        f = faculty_map[m.assignment.faculty_id]
        c = course_map[m.assignment.course_id]
        
        for t in timeslots:
            for r in rooms:
                # 4. Room capacity
                if r.capacity < s.student_count:
                    model.Add(x[(m.id, t.id, r.id)] == 0)
                    
                # 5. Faculty availability
                if t.id not in f.available_timeslots:
                    model.Add(x[(m.id, t.id, r.id)] == 0)
                    
                # 6. Lab requirement
                if c.requires_lab and not r.is_lab:
                    model.Add(x[(m.id, t.id, r.id)] == 0)

    # 7. Required weekly course periods is inherently satisfied 
    # because the engine creates `weekly_periods` number of meetings 
    # for each CourseAssignment, and Constraint 0 ensures they are all scheduled.
