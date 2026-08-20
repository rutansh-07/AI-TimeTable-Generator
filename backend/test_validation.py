import sys
sys.path.insert(0, r'C:\Users\Reema\Desktop\AI-TimeTable-Generator\backend')
from app.db.connection import get_active_schedule
from app.scheduler.orchestrator import prepare_semester_input
from app.scheduler.validator import validate_timetable

ts, rooms, fac, courses, secs, assigns, counts = prepare_semester_input("SEM5")
schedule = get_active_schedule()

is_valid, errors = validate_timetable(schedule, ts, rooms, fac, courses, secs, assigns, counts)

print(f"Valid: {is_valid}")
print(f"Errors count: {len(errors)}")
if errors:
    for e in errors[:5]: print(e)
