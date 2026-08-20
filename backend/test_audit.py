import os, sys, json, urllib.request
from dotenv import load_dotenv
load_dotenv('.env')

sys.path.insert(0, r'C:\Users\Reema\Desktop\AI-TimeTable-Generator\backend')
from app.db.connection import get_db_cursor

schedule_id = 'c65649dc-8056-4f79-9f48-b112469d273e'

# 1. Direct DB Query
with get_db_cursor() as cur:
    cur.execute('''
        SELECT sc.assignment_id, sc.lab_batch_id, sc.period_idx, sc.timeslot_id, sc.room_id,
               lb.batch_code, t.day, t.time, r.name as room_name
        FROM scheduled_classes sc
        JOIN schedules s ON sc.schedule_id = s.id
        LEFT JOIN lab_batches lb ON sc.lab_batch_id = lb.id
        JOIN timeslots t ON sc.timeslot_id = t.id
        JOIN rooms r ON sc.room_id = r.id
        WHERE s.id = %s
        ORDER BY sc.timeslot_id, sc.assignment_id, sc.period_idx;
    ''', (schedule_id,))
    db_rows = cur.fetchall()

print(f"1. Database class count for {schedule_id}: {len(db_rows)}")

# 2. API Call
req = urllib.request.Request('http://localhost:8000/api/timetable/active')
with urllib.request.urlopen(req) as res:
    api_data = json.loads(res.read().decode())

print(f"2. API class count (/api/timetable/active): {len(api_data)}")

# 3 & 4 & 5. Theory vs Lab in API data
theory_classes = [c for c in api_data if not any(c['assignment_id'].endswith(f"_{b}") for b in ['A', 'B', 'C', 'D'])]
lab_classes = [c for c in api_data if any(c['assignment_id'].endswith(f"_{b}") for b in ['A', 'B', 'C', 'D'])]
batch_counts = {b: sum(1 for c in api_data if c['assignment_id'].endswith(f"_{b}")) for b in ['A', 'B', 'C', 'D']}

print(f"3. Theory count: {len(theory_classes)}")
print(f"4. Lab batch count: {len(lab_classes)}")
print(f"   Batch distribution: {batch_counts}")

# 6. Placement comparison
# Build tuples of (assignment_id, period_idx, timeslot_id, room_id, lab_batch_id)
db_tuples = set()
for r in db_rows:
    exp_id = f"{r['assignment_id']}_{r['batch_code']}" if r['batch_code'] else r['assignment_id']
    db_tuples.add((exp_id, r['period_idx'], r['timeslot_id'], r['room_id'], r['lab_batch_id']))

api_tuples = set()
for c in api_data:
    api_tuples.add((c['assignment_id'], c['period_idx'], c['timeslot_id'], c['room_id'], c.get('lab_batch_id')))

print(f"6. Placements exact match: {db_tuples == api_tuples}")
if db_tuples != api_tuples:
    print(f"   Diff DB-API: {db_tuples - api_tuples}")
    print(f"   Diff API-DB: {api_tuples - db_tuples}")

# 7. CE1 Analysis
# CE1 assignments typically start with CA5_CE1
ce1_api = [c for c in api_data if 'CE1' in c['assignment_id']]
ce1_theory = [c for c in ce1_api if not any(c['assignment_id'].endswith(f"_{b}") for b in ['A', 'B', 'C', 'D'])]
ce1_labs = [c for c in ce1_api if any(c['assignment_id'].endswith(f"_{b}") for b in ['A', 'B', 'C', 'D'])]

print(f"\n7. CE1 total classes: {len(ce1_api)}")
print(f"   CE1 theory classes: {len(ce1_theory)}")
print(f"   CE1 lab classes: {len(ce1_labs)}")
ce1_batch_counts = {b: sum(1 for c in ce1_labs if c['assignment_id'].endswith(f"_{b}")) for b in ['A', 'B', 'C', 'D']}
print(f"   CE1 lab batch counts: {ce1_batch_counts}")

# 8. Check how frontend maps CE1
# Let's fetch the semester input data as the frontend does
req_sem = urllib.request.Request('http://localhost:8000/api/hierarchy/SEM5/data')
with urllib.request.urlopen(req_sem) as res:
    sem_data = json.loads(res.read().decode())

sem_assign_ids = {a['id'] for a in sem_data['assignments']}
ce1_sem_assigns = [a for a in sem_data['assignments'] if a['section_id'] == 'S5_CE1']
ce1_sem_assign_ids = {a['id'] for a in ce1_sem_assigns}

print(f"\n8. Frontend Mapping Check:")
print(f"   Total assignments in SEM5 data: {len(sem_assign_ids)}")
print(f"   Total CE1 assignments in SEM5 data: {len(ce1_sem_assign_ids)}")
missing_in_frontend = [c['assignment_id'] for c in ce1_api if c['assignment_id'] not in ce1_sem_assign_ids]
print(f"   CE1 classes with unmapped assignment_id in frontend: {len(missing_in_frontend)}")

# Detail listing of CE1 classes
print("\nCE1 Scheduled Classes breakdown:")
for c in sorted(ce1_api, key=lambda x: (x['timeslot_id'], x['assignment_id'])):
    # lookup timeslot
    ts = next((t for t in sem_data['timeslots'] if t['id'] == c['timeslot_id']), None)
    day = ts['day'] if ts else '?'
    time = ts['time'] if ts else '?'
    print(f"   ID: {c['assignment_id']:<18} | Day: {day:<9} | Time: {time:<5} | Room: {c['room_id']:<5} | Batch: {str(c.get('lab_batch_id')):<10}")

