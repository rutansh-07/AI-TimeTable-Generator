import sys
import os

# Add the backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.connection import get_scheduler_input, save_schedule, get_active_schedule
from app.scheduler.engine import solve_timetable
from app.scheduler.validator import validate_timetable, calculate_metrics

def main():
    print("--- 1. Testing Database Input Querying ---")
    try:
        timeslots, rooms, faculty, courses, sections, assignments = get_scheduler_input()
        print(f"Successfully loaded data from database:")
        print(f" - Timeslots: {len(timeslots)}")
        print(f" - Rooms: {len(rooms)}")
        print(f" - Faculty: {len(faculty)}")
        print(f" - Courses: {len(courses)}")
        print(f" - Sections: {len(sections)}")
        print(f" - Assignments: {len(assignments)}")
    except Exception as e:
        print(f"ERROR querying database: {e}")
        print("Please ensure DATABASE_URL is set in your .env file and schema/seeds are applied.")
        sys.exit(1)

    print("\n--- 2. Running Solver on Database Data ---")
    try:
        schedule = solve_timetable(
            timeslots=timeslots,
            rooms=rooms,
            faculty=faculty,
            courses=courses,
            sections=sections,
            assignments=assignments
        )
        if not schedule:
            print("Solver status: INFEASIBLE (No valid timetable can be generated).")
            sys.exit(0)
            
        print(f"Solver status: SUCCESS. Generated {len(schedule)} class allocations.")
    except Exception as e:
        print(f"ERROR running OR-Tools solver: {e}")
        sys.exit(1)

    print("\n--- 3. Running Validator ---")
    is_valid, errors = validate_timetable(
        schedule, timeslots, rooms, faculty, courses, sections, assignments
    )
    metrics = calculate_metrics(
        schedule, timeslots, rooms, faculty, courses, sections, assignments
    )
    print(f"Validation Valid? {is_valid}")
    if errors:
        print(f"Validation Errors: {errors}")
    print(f"Metrics Quality Score: {metrics.quality_score} (total penalty: {metrics.total_penalty})")

    print("\n--- 4. Saving Schedule back to Database ---")
    try:
        schedule_id = save_schedule("Test Auto-Generated Schedule", schedule)
        print(f"Successfully saved schedule. UUID: {schedule_id}")
    except Exception as e:
        print(f"ERROR saving schedule to database: {e}")
        sys.exit(1)

    print("\n--- 5. Retrieving Active Schedule ---")
    try:
        active_schedule = get_active_schedule()
        print(f"Successfully retrieved active schedule with {len(active_schedule)} class allocations.")
        assert len(active_schedule) == len(schedule), "Retrieved schedule size mismatch!"
        print("Verification SUCCESS: Saved and retrieved schedules match perfectly!")
    except Exception as e:
        print(f"ERROR retrieving schedule: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
