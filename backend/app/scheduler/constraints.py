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
    Applies the hard constraints to the OR-Tools model.
    """
    
    # Helper lookups
    section_map = {s.id: s for s in sections}
    faculty_map = {f.id: f for f in faculty}
    course_map = {c.id: c for c in courses}
    
    # Pre-calculate valid consecutive blocks from TimeSlot metadata (Part C)
    def time_to_minutes(time_str: str) -> int:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m

    valid_block_starts = set()
    timeslot_pairs = {} # t1_id -> t2_id for valid contiguous pairs
    
    # Group by day and sort
    days = {}
    for t in timeslots:
        days.setdefault(t.day, []).append(t)

    # Determine if timetable uses 60-min periods (institutional) or 120-min periods (sandbox)
    has_60min = any(
        time_to_minutes(slots[i+1].time) - time_to_minutes(slots[i].time) == 60
        for slots in days.values()
        for i in range(len(slots) - 1)
    )
    valid_step = 60 if has_60min else 120
        
    for day_slots in days.values():
        day_slots.sort(key=lambda t: time_to_minutes(t.time))
        for i in range(len(day_slots) - 1):
            t1 = day_slots[i]
            t2 = day_slots[i+1]
            diff = time_to_minutes(t2.time) - time_to_minutes(t1.time)
            if diff == valid_step:
                valid_block_starts.add(t1.id)
                timeslot_pairs[t1.id] = t2.id


    # 0. Each meeting must be scheduled exactly once
    for m in meetings:
        model.AddExactlyOne(x[(m.id, t.id, r.id)] for t in timeslots for r in rooms)
        
    # Group meetings by assignment for lab blocks
    assignment_meetings = {}
    for m in meetings:
        assignment_meetings.setdefault(m.assignment.id, []).append(m)

    # 1. No room clash
    for t in timeslots:
        for r in rooms:
            model.AddAtMostOne(x[(m.id, t.id, r.id)] for m in meetings)
            
    # 2. No faculty clash
    for t in timeslots:
        for f in faculty:
            f_meetings = [m for m in meetings if m.assignment.faculty_id == f.id]
            model.AddAtMostOne(x[(m.id, t.id, r.id)] for m in f_meetings for r in rooms)
            
    # 3. No section clash (Batch-aware & Elective-aware)
    for t in timeslots:
        for s in sections:
            s_meetings = [m for m in meetings if m.assignment.section_id == s.id]
            
            # Separate regular whole-section, batch-specific, and elective meetings
            regular_whole = [
                m for m in s_meetings
                if not m.assignment.lab_batch_id and not m.assignment.elective_group_id
            ]
            batches = {
                m.assignment.lab_batch_id for m in s_meetings
                if m.assignment.lab_batch_id and not m.assignment.elective_group_id
            }
            s_elective_groups = {
                m.assignment.elective_group_id for m in s_meetings
                if m.assignment.elective_group_id
            }
            
            # To avoid clashes between parallel elective options in the SAME elective group,
            # we pick at most one representative meeting per elective group per period for section s.
            elective_rep_meetings = []
            for g in s_elective_groups:
                g_meetings = [m for m in s_meetings if m.assignment.elective_group_id == g]
                # Group by period_idx and take the first meeting of each period
                periods_seen = set()
                for m in g_meetings:
                    if m.period_idx not in periods_seen:
                        elective_rep_meetings.append(m)
                        periods_seen.add(m.period_idx)
            
            if not batches:
                # If no batches, regular whole classes and elective slot cannot clash
                model.AddAtMostOne(
                    x[(m.id, t.id, r.id)]
                    for m in (regular_whole + elective_rep_meetings)
                    for r in rooms
                )
            else:
                # If there are batches, each batch can attend at most one class (regular whole, batch lab, or elective)
                for b in batches:
                    b_meetings = [
                        m for m in s_meetings
                        if m.assignment.lab_batch_id == b and not m.assignment.elective_group_id
                    ]
                    model.AddAtMostOne(
                        x[(m.id, t.id, r.id)]
                        for m in (regular_whole + b_meetings + elective_rep_meetings)
                        for r in rooms
                    )

    # 4. Room capacity, 5. Faculty availability, 6. Lab requirement
    for m in meetings:
        f = faculty_map[m.assignment.faculty_id]
        
        for t in timeslots:
            for r in rooms:
                # 4. Room capacity (Part D: uses effective student count)
                if r.capacity < m.effective_student_count:
                    model.Add(x[(m.id, t.id, r.id)] == 0)
                    
                # 5. Faculty availability
                if t.id not in f.available_timeslots:
                    model.Add(x[(m.id, t.id, r.id)] == 0)
                    
                # 6. Lab requirement
                if m.is_lab and not r.is_lab:
                    model.Add(x[(m.id, t.id, r.id)] == 0)

    # Part C: Continuous 2-Hour Lab Blocks
    for aid, ms in assignment_meetings.items():
        if ms[0].is_lab and len(ms) == 2:
            m1, m2 = ms[0], ms[1]
            for t in timeslots:
                for r in rooms:
                    if t.id not in valid_block_starts:
                        # Cannot start a lab block in an invalid slot
                        model.Add(x[(m1.id, t.id, r.id)] == 0)
                    else:
                        # If m1 is scheduled at t, m2 MUST be scheduled at t_next in the SAME room
                        t_next_id = timeslot_pairs[t.id]
                        model.AddImplication(x[(m1.id, t.id, r.id)], x[(m2.id, t_next_id, r.id)])

    # Step 3B: Cross-Department Elective Group Synchronization
    # All courses in the same elective group must be scheduled at the exact same timeslot per period
    elective_groups: Dict[str, Dict[int, List[Any]]] = {} # group_id -> {period_idx: [meetings]}
    for m in meetings:
        gid = m.assignment.elective_group_id
        if gid:
            elective_groups.setdefault(gid, {}).setdefault(m.period_idx, []).append(m)

    for gid, periods_map in elective_groups.items():
        for period_idx, group_meetings in periods_map.items():
            if len(group_meetings) >= 2:
                ref_m = group_meetings[0]
                for other_m in group_meetings[1:]:
                    for t in timeslots:
                        # CP-SAT linear equality: sum of rooms for other_m at timeslot t == sum of rooms for ref_m at timeslot t
                        model.Add(
                            sum(x[(other_m.id, t.id, r.id)] for r in rooms)
                            == sum(x[(ref_m.id, t.id, r.id)] for r in rooms)
                        )

    # 7. Required weekly course periods is inherently satisfied 
    # because the engine creates `weekly_periods` number of meetings 
    # for each CourseAssignment, and Constraint 0 ensures they are all scheduled.

