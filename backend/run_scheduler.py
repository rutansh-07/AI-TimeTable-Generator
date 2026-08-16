import sys
import os

# Add the backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.scheduler.data_generator import generate_test_data
from app.scheduler.engine import solve_timetable
from app.scheduler.validator import validate_timetable, calculate_metrics

def main():
    print("Generating test data...")
    timeslots, rooms, faculty, courses, sections, assignments = generate_test_data()
    
    print("Solving timetable...")
    schedule = solve_timetable(
        timeslots=timeslots,
        rooms=rooms,
        faculty=faculty,
        courses=courses,
        sections=sections,
        assignments=assignments
    )
    
    if not schedule:
        print("No feasible schedule found.")
        return
        
    print(f"Success! Scheduled {len(schedule)} classes.")
    
    print("\n--- HARD CONSTRAINT VALIDATION ---")
    is_valid, errors = validate_timetable(
        schedule, timeslots, rooms, faculty, courses, sections, assignments
    )
    
    if is_valid:
        print("Status: VALID")
        print("All 7 hard constraints passed.")
    else:
        print("Status: INVALID")
        for e in errors:
            print(f"- {e}")
            
    print("\n--- OPTIMIZATION METRICS ---")
    metrics = calculate_metrics(schedule, timeslots, rooms, faculty, courses, sections, assignments)
    print(f"Total student/section gaps   : {metrics.total_gaps}")
    print(f"Faculty workload imbalance   : {metrics.faculty_imbalance}")
    print(f"Room capacity wastage        : {metrics.room_utilization_penalty}")
    print(f"Faculty preference violations: {metrics.preference_violations}")
    print(f"Total penalty                : {metrics.total_penalty}")
    print(f"Quality score                : {metrics.quality_score}")
    
    print("\n--- TIMETABLE OUTPUT ---")
    # Pretty print
    ts_map = {t.id: t for t in timeslots}
    room_map = {r.id: r for r in rooms}
    fac_map = {f.id: f for f in faculty}
    course_map = {c.id: c for c in courses}
    sec_map = {s.id: s for s in sections}
    assign_map = {a.id: a for a in assignments}
    
    # Sort by timeslot then room
    schedule.sort(key=lambda x: (x.timeslot_id, x.room_id))
    
    for sc in schedule:
        t = ts_map[sc.timeslot_id]
        r = room_map[sc.room_id]
        a = assign_map[sc.assignment_id]
        c = course_map[a.course_id]
        f = fac_map[a.faculty_id]
        s = sec_map[a.section_id]
        
        print(f"[{t.day} {t.time}] {r.name[:15]:15} | {c.name[:15]:15} | Section {s.name[:10]:10} | {f.name}")

if __name__ == "__main__":
    main()
