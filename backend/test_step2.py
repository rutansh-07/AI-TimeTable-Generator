import os
import sys

sys.path.insert(0, os.getcwd())

from app.scheduler.orchestrator import prepare_semester_input
from app.scheduler.engine import solve_timetable
from app.scheduler.validator import validate_timetable
from app.scheduler.models import ScheduledClass

def run_tests():
    print("=== TEST 1: SEM5 hierarchy loads correctly ===")
    ts, rooms, faculty, courses, sections, assignments, student_counts = prepare_semester_input("SEM5")
    assert len(sections) > 0, "No sections loaded for SEM5"
    print("  OK: Data loaded")

    print("=== TEST 2: 6 sections are loaded ===")
    assert len(sections) == 6, f"Expected 6 sections, got {len(sections)}"
    print("  OK: 6 sections loaded")

    print("=== TEST 3: 24 lab batches are loaded ===")
    lab_assignments = [a for a in assignments if a.lab_batch_id]
    # Each lab course (e.g. OS_P, CN_P in CE) is required by 6 sections, 2 lab courses each -> wait, depends on curriculum.
    # CE has OS_P, CN_P (2). 2 sections = 4 section-courses. 4 batches each = 16.
    # Total sections = 6. Each has 2 lab courses. Total section-courses = 12. Each has 4 batches = 48 lab batch assignments.
    assert len(lab_assignments) == 48, f"Expected 48 lab batch assignments, got {len(lab_assignments)}"
    # Let's count unique batches
    unique_batches = {a.lab_batch_id for a in lab_assignments}
    assert len(unique_batches) == 24, f"Expected 24 unique lab batches, got {len(unique_batches)}"
    print("  OK: 24 lab batches are loaded via assignments")

    print("=== TEST 4: No SEM1-4 accidentally enters ===")
    for s in sections:
        assert s.semester_id == "SEM5", f"Section {s.name} from {s.semester_id} loaded"
    print("  OK: Only SEM5 records loaded")

    print("=== TEST 10: Validator detects intentionally broken lab ===")
    # Create fake schedule
    lab_a = lab_assignments[0]
    sc1 = ScheduledClass(assignment_id=lab_a.id, period_idx=0, timeslot_id=0, room_id='L104')
    # Broken 1: not contiguous (e.g., 0 and 2 are 2 hrs apart for institutional, but diff is what? 09:10 and 12:10 is 180 min)
    sc2 = ScheduledClass(assignment_id=lab_a.id, period_idx=1, timeslot_id=2, room_id='L104')
    is_valid, errors = validate_timetable([sc1, sc2], ts, rooms, faculty, courses, sections, assignments, student_counts)
    assert not is_valid
    assert any("not contiguous" in str(e) for e in errors), "Validator missed non-contiguous lab"

    # Broken 2: different rooms
    sc3 = ScheduledClass(assignment_id=lab_a.id, period_idx=1, timeslot_id=1, room_id='L105')
    is_valid, errors = validate_timetable([sc1, sc3], ts, rooms, faculty, courses, sections, assignments, student_counts)
    assert not is_valid
    assert any("different rooms" in str(e) for e in errors), "Validator missed different rooms"
    
    # Broken 3: capacity violation
    sc1.room_id = 'R123'  # Not a lab!
    sc4 = ScheduledClass(assignment_id=lab_a.id, period_idx=1, timeslot_id=1, room_id='R123')
    is_valid, errors = validate_timetable([sc1, sc4], ts, rooms, faculty, courses, sections, assignments, student_counts)
    assert not is_valid
    assert any("not a lab" in str(e) for e in errors), "Validator missed non-lab room"
    print("  OK: Validator correctly identifies broken lab schedules")

    print("=== TEST 5-9: Solving SEM5 ===")
    print("Solving... this may take up to 60 seconds")
    schedule = solve_timetable(ts, rooms, faculty, courses, sections, assignments, student_counts)
    if not schedule:
        print("  FAIL: Solver returned infeasible")
    else:
        print(f"  OK: Solved with {len(schedule)} classes")
        is_valid, errors = validate_timetable(schedule, ts, rooms, faculty, courses, sections, assignments, student_counts)
        if not is_valid:
            print("  FAIL: Solved schedule is invalid!")
            for e in errors:
                print("   -", e)
        else:
            print("  OK: Solved schedule is valid!")
            
    print("=== TEST 11: Existing sandbox generation works ===")
    from app.db.connection import get_scheduler_input
    # Get all assignments (includes sandbox which have no semester)
    ts2, rooms2, fac2, c2, sec2, assign2 = get_scheduler_input()
    
    # Sandbox assignments have ids A1, A2, etc. Filter them for the test if needed, or just let them all solve?
    # wait, get_scheduler_input() loads EVERYTHING. Which means SEM5 + sandbox. That will definitely fail capacity or time constraints!
    # Wait, sandbox uses timeslot IDs 0-11. SEM5 also uses 0-11 and up to 29.
    # The sandbox courses/faculty are independent, but they compete for rooms! Room L1, R1, etc.
    # But wait, we didn't delete the sandbox rooms. We kept them.
    # If the user hits /api/timetable/generate (which uses SAMPLE_DATA from frontend), it passes its own JSON, NOT db.
    from app.scheduler.data_generator import generate_test_data
    sts, srooms, sfac, sc, ssec, sassign = generate_test_data()
    ssched = solve_timetable(sts, srooms, sfac, sc, ssec, sassign)
    assert len(ssched) > 0, "Sandbox solver failed"
    is_valid, errors = validate_timetable(ssched, sts, srooms, sfac, sc, ssec, sassign)
    assert is_valid, f"Sandbox validation failed: {errors}"
    print("  OK: Sandbox data scheduling remains functional")

if __name__ == '__main__':
    run_tests()
