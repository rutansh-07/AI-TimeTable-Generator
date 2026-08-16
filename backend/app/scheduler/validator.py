from typing import List, Tuple
from .models import ScheduledClass, TimeSlot, Room, Faculty, Course, Section, CourseAssignment, ScheduleMetrics
from .objectives import WEIGHTS

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
    room_schedule = {} 
    faculty_schedule = {}
    section_schedule = {}
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
            errors.append(f"Capacity violated: Section {s.name} (size {s.student_count}) in Room {r.name} (cap {r.capacity}) at {t.time}.")
            
        # 5. Faculty availability
        if t.id not in f.available_timeslots:
            errors.append(f"Availability violated: Faculty {f.name} scheduled at {t.time} but is not available.")
            
        # 6. Lab requirement
        if c.requires_lab and not r.is_lab:
            errors.append(f"Lab violated: Course {c.name} requires lab, but Room {r.name} is not a lab.")
            
    # Check clashes
    for (tid, rid), assign_ids in room_schedule.items():
        if len(assign_ids) > 1:
            errors.append(f"Room clash in room {room_map[rid].name} at {ts_map[tid].time}")
            
    for (tid, fid), assign_ids in faculty_schedule.items():
        if len(assign_ids) > 1:
            errors.append(f"Faculty clash for {fac_map[fid].name} at {ts_map[tid].time}")
            
    for (tid, sid), assign_ids in section_schedule.items():
        if len(assign_ids) > 1:
            errors.append(f"Section clash for {sec_map[sid].name} at {ts_map[tid].time}")
            
    # 7. Required weekly course periods
    for a in assignments:
        if meetings_per_assignment[a.id] != a.weekly_periods:
            errors.append(f"Periods violated: Assignment {a.id} required {a.weekly_periods} but got {meetings_per_assignment[a.id]}.")
            
    is_valid = len(errors) == 0
    return is_valid, errors

def calculate_metrics(
    schedule: List[ScheduledClass],
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section],
    assignments: List[CourseAssignment]
) -> ScheduleMetrics:
    # Lookups
    ts_map = {t.id: t for t in timeslots}
    room_map = {r.id: r for r in rooms}
    fac_map = {f.id: f for f in faculty}
    sec_map = {s.id: s for s in sections}
    assign_map = {a.id: a for a in assignments}
    
    total_gaps = 0
    faculty_imbalance = 0
    room_utilization_penalty = 0
    preference_violations = 0
    
    # 1. Total student/section gaps
    days = list(set(t.day for t in timeslots))
    
    for s in sections:
        # Group section's scheduled classes by day
        for day in days:
            day_classes = [sc for sc in schedule if ts_map[sc.timeslot_id].day == day and assign_map[sc.assignment_id].section_id == s.id]
            if not day_classes:
                continue
            
            # Find first and last slot indices for this section on this day
            day_slots_ordered = [t for t in timeslots if t.day == day]
            day_slot_ids = {t.id: i for i, t in enumerate(day_slots_ordered)}
            
            indices = [day_slot_ids[sc.timeslot_id] for sc in day_classes]
            first = min(indices)
            last = max(indices)
            span = last - first + 1
            gaps = span - len(day_classes)
            total_gaps += gaps
            
    # 2. Faculty workload imbalance
    for f in faculty:
        fac_classes = [sc for sc in schedule if assign_map[sc.assignment_id].faculty_id == f.id]
        if not fac_classes:
            continue
        
        classes_per_day = {day: 0 for day in days}
        for sc in fac_classes:
            classes_per_day[ts_map[sc.timeslot_id].day] += 1
            
        max_c = max(classes_per_day.values())
        min_c = min(classes_per_day.values())
        faculty_imbalance += (max_c - min_c)
        
    # 3. Room utilization penalty & 4. Preference violations
    for sc in schedule:
        a = assign_map[sc.assignment_id]
        r = room_map[sc.room_id]
        s = sec_map[a.section_id]
        f = fac_map[a.faculty_id]
        
        # Room utilization
        wastage = r.capacity - s.student_count
        if wastage > 0:
            room_utilization_penalty += wastage
            
        # Faculty preference
        if sc.timeslot_id not in f.preferred_timeslots:
            preference_violations += 1
            
    total_penalty = (
        total_gaps * WEIGHTS["student_gap"] +
        faculty_imbalance * WEIGHTS["faculty_imbalance"] +
        preference_violations * WEIGHTS["non_preferred_slot"] +
        room_utilization_penalty * WEIGHTS["room_wastage"]
    )
    
    quality_score = 10000 - total_penalty
    
    return ScheduleMetrics(
        total_gaps=total_gaps,
        faculty_imbalance=faculty_imbalance,
        room_utilization_penalty=room_utilization_penalty,
        preference_violations=preference_violations,
        total_penalty=total_penalty,
        quality_score=quality_score
    )
