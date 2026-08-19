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
    assignments: List[CourseAssignment],
    assignment_student_counts: dict = None
) -> Tuple[bool, List[str]]:
    """
    Validates a generated timetable against all hard constraints.
    Returns (is_valid, list_of_errors).
    """
    if assignment_student_counts is None:
        assignment_student_counts = {}
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
        effective_capacity = assignment_student_counts.get(a.id, s.student_count)
        if r.capacity < effective_capacity:
            errors.append(f"Capacity violated: Assignment {a.id} (size {effective_capacity}) in Room {r.name} (cap {r.capacity}) at {t.time}.")
            
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
            # Check if it's a valid batch-parallelism or same-elective-group coexistence
            # Rule:
            # 1. Multiple assignments in the EXACT same elective_group_id may coexist (parallel tracks).
            # 2. Multiple assignments in DIFFERENT lab batches (and no regular whole / elective) may coexist.
            # 3. Any mix of regular whole with batch/elective, or distinct elective groups, is a clash.
            
            # Check if all assignments belong to the same elective group
            elective_groups = {assign_map[aid].elective_group_id for aid in assign_ids if assign_map[aid].elective_group_id}
            has_regular_whole = any(
                not assign_map[aid].lab_batch_id and not assign_map[aid].elective_group_id
                for aid in assign_ids
            )
            has_batches = any(assign_map[aid].lab_batch_id for aid in assign_ids)
            
            if elective_groups and len(elective_groups) == 1 and not has_regular_whole and not has_batches:
                # All assignments belong to the same elective group — valid parallel elective options
                pass
            else:
                batches = set()
                clash = False
                for aid in assign_ids:
                    a_obj = assign_map[aid]
                    b = a_obj.lab_batch_id
                    g = a_obj.elective_group_id
                    
                    if not b and not g:
                        # Regular whole section class clashes with any other class at this time
                        errors.append(f"Section clash for {sec_map[sid].name} at {ts_map[tid].time} (lecture '{course_map[a_obj.course_id].name}' overlaps with other classes).")
                        clash = True
                        break
                    elif b:
                        if b in batches or elective_groups or has_regular_whole:
                            errors.append(f"Batch clash for {sec_map[sid].name} Batch {b} at {ts_map[tid].time}.")
                            clash = True
                            break
                        batches.add(b)
                    elif g:
                        if has_regular_whole or has_batches or len(elective_groups) > 1:
                            errors.append(f"Elective slot clash for {sec_map[sid].name} at {ts_map[tid].time} with other classes.")
                            clash = True
                            break
                
    # 7. Required weekly course periods & Lab continuous block
    def time_to_minutes(time_str: str) -> int:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
        
    days_map = {}
    for t in timeslots:
        days_map.setdefault(t.day, []).append(t)
    has_60min = any(
        time_to_minutes(slots[i+1].time) - time_to_minutes(slots[i].time) == 60
        for slots in days_map.values()
        for i in range(len(slots) - 1)
    )
    valid_step = 60 if has_60min else 120

    for a in assignments:
        if meetings_per_assignment[a.id] != a.weekly_periods:
            errors.append(f"Periods violated: Assignment {a.id} required {a.weekly_periods} but got {meetings_per_assignment[a.id]}.")
            
        c = course_map[a.course_id]
        if c.requires_lab and a.weekly_periods == 2:
            a_classes = sorted([sc for sc in schedule if sc.assignment_id == a.id], key=lambda sc: sc.period_idx)
            if len(a_classes) == 2:
                sc1, sc2 = a_classes[0], a_classes[1]
                t1, t2 = ts_map[sc1.timeslot_id], ts_map[sc2.timeslot_id]
                
                if t1.day != t2.day:
                    errors.append(f"Lab block broken: Assignment {a.id} spans multiple days ({t1.day} and {t2.day}).")
                if sc1.room_id != sc2.room_id:
                    errors.append(f"Lab block broken: Assignment {a.id} uses different rooms ({sc1.room_id} and {sc2.room_id}).")
                    
                diff = time_to_minutes(t2.time) - time_to_minutes(t1.time)
                if diff != valid_step:
                    errors.append(f"Lab block broken: Assignment {a.id} slots are not contiguous ({t1.time} to {t2.time}).")

    # 8. Step 3B: Elective Group Synchronization Independent Validation
    elective_assignment_map: dict = {}
    for a in assignments:
        if a.elective_group_id:
            elective_assignment_map.setdefault(a.elective_group_id, []).append(a)

    for gid, group_assigns in elective_assignment_map.items():
        if len(group_assigns) >= 2:
            min_periods = min(a.weekly_periods for a in group_assigns)
            for period_idx in range(min_periods):
                scheduled_slots = {}
                for a in group_assigns:
                    sc = next((sc for sc in schedule if sc.assignment_id == a.id and sc.period_idx == period_idx), None)
                    if sc:
                        scheduled_slots[a.id] = sc.timeslot_id
                
                distinct_slots = set(scheduled_slots.values())
                if len(distinct_slots) > 1:
                    slot_details = ", ".join(
                        f"Assign {aid}: Slot {tid} ({ts_map[tid].day} {ts_map[tid].time})"
                        for aid, tid in scheduled_slots.items()
                    )
                    errors.append(
                        f"Elective synchronization violated for group '{gid}' at period {period_idx}: {slot_details}"
                    )
            
    is_valid = len(errors) == 0
    return is_valid, errors


def calculate_metrics(
    schedule: List[ScheduledClass],
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section],
    assignments: List[CourseAssignment],
    assignment_student_counts: dict = None
) -> ScheduleMetrics:
    if assignment_student_counts is None:
        assignment_student_counts = {}
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
        effective_capacity = assignment_student_counts.get(a.id, s.student_count)
        wastage = r.capacity - effective_capacity
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
