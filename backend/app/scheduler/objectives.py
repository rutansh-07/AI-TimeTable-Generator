from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment

WEIGHTS = {
    "student_gap": 10,
    "faculty_imbalance": 8,
    "non_preferred_slot": 5,
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
    """
    Applies the soft objectives by calculating a total penalty and setting the model to minimize it.
    """
    penalties = []
    
    # Helper structures
    days = list(set(t.day for t in timeslots))
    timeslots_by_day = {day: [t for t in timeslots if t.day == day] for day in days}
    
    section_map = {s.id: s for s in sections}
    faculty_map = {f.id: f for f in faculty}
    
    # --- Objective 1: Minimize section gaps ---
    section_has_class = {}
    for s in sections:
        s_meetings = [m for m in meetings if m.assignment.section_id == s.id]
        for day in days:
            day_slots = timeslots_by_day[day]
            for i, t in enumerate(day_slots):
                b = model.NewBoolVar(f"sec_{s.id}_has_class_{t.id}")
                model.AddMaxEquality(b, [x[(m.id, t.id, r.id)] for m in s_meetings for r in rooms] + [0])
                section_has_class[(s.id, i, day)] = b
                
    for s in sections:
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

    # --- Objective 2: Balance faculty workload ---
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
        
    # --- Objective 3: Improve room utilization ---
    for m in meetings:
        s = section_map[m.assignment.section_id]
        for t in timeslots:
            for r in rooms:
                wastage = r.capacity - s.student_count
                if wastage > 0:
                    penalties.append(x[(m.id, t.id, r.id)] * wastage * WEIGHTS["room_wastage"])
                    
    # --- Objective 4: Prefer faculty timeslots ---
    for m in meetings:
        f = faculty_map[m.assignment.faculty_id]
        for t in timeslots:
            if t.id not in f.preferred_timeslots:
                for r in rooms:
                    penalties.append(x[(m.id, t.id, r.id)] * WEIGHTS["non_preferred_slot"])
                    
    # Sum up penalties and minimize
    if penalties:
        total_penalty = model.NewIntVar(0, 1000000, "total_penalty")
        model.Add(total_penalty == sum(penalties))
        model.Minimize(total_penalty)
