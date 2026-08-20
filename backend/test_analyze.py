import os, sys
sys.path.insert(0, r'C:\Users\Reema\Desktop\AI-TimeTable-Generator\backend')
from app.db.connection import get_active_schedule
from app.scheduler.orchestrator import prepare_semester_input
from collections import defaultdict

def analyze_full():
    ts, rooms, fac, courses, secs, assigns, counts = prepare_semester_input("SEM5")
    
    # assign_map from base id OR expanded id
    assign_map = {}
    for a in assigns:
        assign_map[a.id] = a
        if a.database_assignment_id:
            assign_map[a.database_assignment_id] = a
            
    schedule = get_active_schedule()
    
    days_set = sorted(set(t.day for t in ts))
    def time_to_min(t_str):
        h, m = map(int, t_str.split(':'))
        return h * 60 + m
    
    slots_by_day = {}
    for day in days_set:
        slots_by_day[day] = sorted([t for t in ts if t.day == day], key=lambda t: time_to_min(t.time))
        
    slot_index = {}
    for day, day_ts in slots_by_day.items():
        for i, t in enumerate(day_ts):
            slot_index[t.id] = (day, i)
            
    sec_day_slots = defaultdict(lambda: defaultdict(set))
    for sc in schedule:
        a = assign_map.get(sc.assignment_id)
        if a is None:
            continue
        sid = a.section_id
        if sc.timeslot_id in slot_index:
            day, idx = slot_index[sc.timeslot_id]
            sec_day_slots[sid][day].add(idx)
            
    for s in sorted(secs, key=lambda s: s.id):
        print(f"Section {s.id}:")
        for day in days_set:
            occupied = sorted(sec_day_slots[s.id][day])
            if occupied:
                pattern = ['.' for _ in range(6)]
                for idx in occupied:
                    pattern[idx] = 'X'
                print(f"  {day}: {''.join(pattern)}  (span={occupied[-1]-occupied[0]})")
        print()

if __name__ == '__main__':
    analyze_full()
