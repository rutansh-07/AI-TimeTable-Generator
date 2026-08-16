from typing import List, Tuple
from .models import ScheduledClass, TimeSlot, Room, Faculty, Course, Section, CourseAssignment

def validate_timetable(
    schedule: List[ScheduledClass],
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section],
    assignments: List[CourseAssignment]
) -> Tuple[bool, List[str]]:
    """
    Validates a generated timetable against all hard constraints.
    Returns (is_valid, list_of_errors).
    """
    if not schedule:
        return False, ["Schedule is empty."]
        
    errors = []
    
    # Lookups
    ts_map = {t.id: t for t in timeslots}
    room_map = {r.id: r for r in rooms}
    fac_map = {f.id: f for f in faculty}
    course_map = {c.id: c for c in courses}
    sec_map = {s.id: s for s in sections}
    assign_map = {a.id: a for a in assignments}
    
    # Trackers for clash detection
    # Maps (timeslot_id, room_id) -> list of assignment_ids
    room_schedule = {} 
    # Maps (timeslot_id, faculty_id) -> list of assignment_ids
    faculty_schedule = {}
    # Maps (timeslot_id, section_id) -> list of assignment_ids
    section_schedule = {}
    
    # Track meetings per assignment
    meetings_per_assignment = {a.id: 0 for a in assignments}

    for sc in schedule:
        a = assign_map[sc.assignment_id]
        c = course_map[a.course_id]
        f = fac_map[a.faculty_id]
        s = sec_map[a.section_id]
        r = room_map[sc.room_id]
        t = ts_map[sc.timeslot_id]
        
        meetings_per_assignment[a.id] += 1
        
        # 1. No room clash
        rt_key = (t.id, r.id)
        if rt_key not in room_schedule:
            room_schedule[rt_key] = []
        room_schedule[rt_key].append(a.id)
        
        # 2. No faculty clash
        ft_key = (t.id, f.id)
        if ft_key not in faculty_schedule:
            faculty_schedule[ft_key] = []
        faculty_schedule[ft_key].append(a.id)
        
        # 3. No section clash
        st_key = (t.id, s.id)
        if st_key not in section_schedule:
            section_schedule[st_key] = []
        section_schedule[st_key].append(a.id)
        
        # 4. Room capacity
        if r.capacity < s.student_count:
            errors.append(f"Capacity violated: Section {s.name} (size {s.student_count}) in Room {r.name} (cap {r.capacity}) at {t}.")
            
        # 5. Faculty availability
        if t.id not in f.available_timeslots:
            errors.append(f"Availability violated: Faculty {f.name} scheduled at {t} but is not available.")
            
        # 6. Lab requirement
        if c.requires_lab and not r.is_lab:
            errors.append(f"Lab violated: Course {c.name} requires lab, but Room {r.name} is not a lab.")
            
    # Check clashes
    for (tid, rid), assign_ids in room_schedule.items():
        if len(assign_ids) > 1:
            errors.append(f"Room clash in room {room_map[rid].name} at {ts_map[tid]}")
            
    for (tid, fid), assign_ids in faculty_schedule.items():
        if len(assign_ids) > 1:
            errors.append(f"Faculty clash for {fac_map[fid].name} at {ts_map[tid]}")
            
    for (tid, sid), assign_ids in section_schedule.items():
        if len(assign_ids) > 1:
            errors.append(f"Section clash for {sec_map[sid].name} at {ts_map[tid]}")
            
    # 7. Required weekly course periods
    for a in assignments:
        if meetings_per_assignment[a.id] != a.weekly_periods:
            errors.append(f"Periods violated: Assignment {a.id} required {a.weekly_periods} but got {meetings_per_assignment[a.id]}.")
            
    is_valid = len(errors) == 0
    return is_valid, errors
