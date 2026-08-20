import os, sys, json
from dotenv import load_dotenv
load_dotenv('.env')

sys.path.insert(0, r'C:\Users\Reema\Desktop\AI-TimeTable-Generator\backend')
from app.db.connection import get_db_cursor
from app.scheduler.orchestrator import prepare_semester_input
from collections import defaultdict

ts, rooms, fac, courses, secs, assigns, counts = prepare_semester_input("SEM5")

assign_map = {}
for a in assigns:
    assign_map[a.id] = a
    if a.database_assignment_id:
        assign_map[a.database_assignment_id] = a

with get_db_cursor() as cur:
    cur.execute('''
        SELECT sc.assignment_id, sc.lab_batch_id, sc.period_idx, sc.timeslot_id, sc.room_id,
               lb.batch_code, t.day, t.time
        FROM scheduled_classes sc
        JOIN schedules s ON sc.schedule_id = s.id
        LEFT JOIN lab_batches lb ON sc.lab_batch_id = lb.id
        JOIN timeslots t ON sc.timeslot_id = t.id
        WHERE s.is_active = TRUE
    ''')
    schedule = cur.fetchall()

days_set = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
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
for r in schedule:
    aid = r['assignment_id']
    batch = r['batch_code']
    exp_id = f"{aid}_{batch}" if batch else aid
    
    a = assign_map.get(exp_id)
    if not a: continue
    
    day, idx = slot_index[r['timeslot_id']]
    sec_day_slots[a.section_id][day].add(idx)

print("SECTION | MON | TUE | WED | THU | FRI | GAPS | ACTIVE DAYS | SPAN | ISOLATED")
print("-" * 85)

for s in sorted(secs, key=lambda s: s.id):
    row_days = []
    sec_gaps = 0
    sec_active = 0
    sec_span = 0
    sec_iso = 0
    
    for day in days_set:
        occ = sorted(sec_day_slots[s.id][day])
        if not occ:
            row_days.append("0")
            continue
            
        sec_active += 1
        day_classes = len(occ)
        row_days.append(str(day_classes))
        
        span = occ[-1] - occ[0]
        sec_span += span
        
        if day_classes == 1:
            sec_iso += 1
            
        for i in range(occ[0] + 1, occ[-1]):
            if i not in occ:
                sec_gaps += 1

    days_str = " | ".join(f"{d:>3}" for d in row_days)
    print(f"{s.id:7} | {days_str} | {sec_gaps:>4} | {sec_active:>11} | {sec_span:>4} | {sec_iso:>8}")

print("\nCE1 Detailed Visual:")
for day in days_set:
    occ = sorted(sec_day_slots['S5_CE1'][day])
    pattern = ['.' for _ in range(6)]
    for idx in occ:
        pattern[idx] = 'X'
    print(f"  {day[:3]}: {''.join(pattern)}  (span={occ[-1]-occ[0] if occ else 0})")

