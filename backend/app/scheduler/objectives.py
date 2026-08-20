from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment

WEIGHTS = {
    "student_gap": 100,
    "daily_span": 10,
    "faculty_imbalance": 40,
    "non_preferred_slot": 20,
    "room_wastage": 1
}

def apply_soft_objectives(
    model: cp_model.CpModel,
    x: Dict[tuple, Any],
    meetings: List[Any],
    timeslots: List[TimeSlot],
    rooms: List[Room],
    faculty: List[Faculty],
    courses: List[Course],
    sections: List[Section]
):
    penalties = []
    
    # Helper structures
    days = sorted(list(set(t.day for t in timeslots)))
    def time_to_minutes(t_str: str) -> int:
        h, m = map(int, t_str.split(':'))
        return h * 60 + m

    timeslots_by_day = {}
    for day in days:
        timeslots_by_day[day] = sorted(
            [t for t in timeslots if t.day == day],
            key=lambda t: time_to_minutes(t.time)
        )
        
    section_map = {s.id: s for s in sections}
    faculty_map = {f.id: f for f in faculty}
    
    # --- Objective 1: Minimize section gaps ---
    section_has_class = {}
    for s in sections:
        s_meetings = [m for m in meetings if m.assignment.section_id == s.id]
        if not s_meetings:
            continue
        for day in days:
            day_slots = timeslots_by_day[day]
            for i, t in enumerate(day_slots):
                b = model.NewBoolVar(f"sec_{s.id}_has_class_{t.id}")
                model.AddMaxEquality(b, [x[(m.id, t.id, r.id)] for m in s_meetings for r in rooms] + [0])
                section_has_class[(s.id, i, day)] = b
                
    for s in sections:
        s_meetings = [m for m in meetings if m.assignment.section_id == s.id]
        if not s_meetings:
            continue
        for day in days:
            day_slots = timeslots_by_day[day]
            num_slots = len(day_slots)
            
            for i in range(1, num_slots - 1):
                t = day_slots[i]
                b_this = section_has_class[(s.id, i, day)]
                
                has_before = model.NewBoolVar(f"has_before_{s.id}_{t.id}")
                model.AddMaxEquality(has_before, [section_has_class[(s.id, j, day)] for j in range(0, i)] + [0])
                
                has_after = model.NewBoolVar(f"has_after_{s.id}_{t.id}")
                model.AddMaxEquality(has_after, [section_has_class[(s.id, j, day)] for j in range(i+1, num_slots)] + [0])
                
                is_gap = model.NewBoolVar(f"is_gap_{s.id}_{t.id}")
                model.Add(is_gap <= has_before)
                model.Add(is_gap <= has_after)
                model.Add(is_gap <= 1 - b_this)
                model.Add(is_gap >= has_before + has_after + (1 - b_this) - 2)
                
                penalties.append(is_gap * WEIGHTS["student_gap"])

    # --- Objective 2: Minimize Daily Span ---
    for s in sections:
        s_meetings = [m for m in meetings if m.assignment.section_id == s.id]
        if not s_meetings:
            continue
        for day in days:
            day_slots = timeslots_by_day[day]
            num_slots = len(day_slots)
            
            first = model.NewIntVar(0, num_slots - 1, f"first_{s.id}_{day}")
            last = model.NewIntVar(0, num_slots - 1, f"last_{s.id}_{day}")
            
            for i in range(num_slots):
                b = section_has_class[(s.id, i, day)]
                model.Add(last >= i).OnlyEnforceIf(b)
                model.Add(first <= i).OnlyEnforceIf(b)
                
            span = model.NewIntVar(0, num_slots - 1, f"span_{s.id}_{day}")
            model.Add(span == last - first)
            penalties.append(span * WEIGHTS["daily_span"])

    # --- Objective 3: Balance faculty workload ---
    for f in faculty:
        f_meetings = [m for m in meetings if m.assignment.faculty_id == f.id]
        if not f_meetings:
            continue
            
        classes_per_day = []
        for day in days:
            day_slots = timeslots_by_day[day]
            day_sum = model.NewIntVar(0, len(day_slots), f"fac_{f.id}_sum_{day}")
            model.Add(day_sum == sum(x[(m.id, t.id, r.id)] for m in f_meetings for t in day_slots for r in rooms))
            classes_per_day.append(day_sum)
            
        max_classes = model.NewIntVar(0, len(timeslots), f"fac_{f.id}_max")
        min_classes = model.NewIntVar(0, len(timeslots), f"fac_{f.id}_min")
        
        model.AddMaxEquality(max_classes, classes_per_day)
        model.AddMinEquality(min_classes, classes_per_day)
        
        diff = model.NewIntVar(0, len(timeslots), f"fac_{f.id}_diff")
        model.Add(diff == max_classes - min_classes)
        penalties.append(diff * WEIGHTS["faculty_imbalance"])
        
    # --- Objective 4: Room utilization & preferred slots ---
    for m in meetings:
        f = faculty_map[m.assignment.faculty_id]
        for t in timeslots:
            for r in rooms:
                wastage = r.capacity - m.effective_student_count
                if wastage > 0:
                    penalties.append(x[(m.id, t.id, r.id)] * wastage * WEIGHTS["room_wastage"])
                
                if t.id not in f.preferred_timeslots:
                    penalties.append(x[(m.id, t.id, r.id)] * WEIGHTS["non_preferred_slot"])
                    
    if penalties:
        # Avoid Int overflow bug by letting solver bound it implicitly
        model.Minimize(sum(penalties))
