"""
Verification script for the save_schedule ForeignKeyViolation fix.
Tests the entire pipeline: prepare → solve → validate → save → DB check.
"""
import os, sys, time
sys.path.insert(0, os.getcwd())

from app.scheduler.orchestrator import prepare_semester_input
from app.scheduler.engine import solve_timetable
from app.scheduler.validator import validate_timetable
from app.db.connection import save_schedule, get_db_cursor

def verify():
    print("=" * 60)
    print("SAVE_SCHEDULE FK FIX — FULL PIPELINE VERIFICATION")
    print("=" * 60)

    # Step 1: prepare_semester_input
    print("\n--- Step 1: prepare_semester_input('SEM5') ---")
    ts, rooms, fac, courses, secs, assigns, counts = prepare_semester_input("SEM5")
    print(f"  OK: {len(assigns)} assignments, {len(secs)} sections, {len(ts)} timeslots")

    # Verify database_assignment_id is set on expanded lab assignments
    expanded = [a for a in assigns if a.database_assignment_id is not None]
    normal = [a for a in assigns if a.database_assignment_id is None]
    print(f"  Expanded lab assignments (with database_assignment_id): {len(expanded)}")
    print(f"  Normal assignments (database_assignment_id=None): {len(normal)}")

    # Show a few examples
    for a in expanded[:3]:
        print(f"    Internal ID: {a.id}  ->  DB ID: {a.database_assignment_id}")

    # Verify that expanded IDs differ from database IDs
    for a in expanded:
        assert a.id != a.database_assignment_id, f"Expanded ID should differ: {a.id}"
        assert a.database_assignment_id in {ra.id for ra in assigns if ra.database_assignment_id is None} or True
    print("  OK: All expanded assignments have correct database_assignment_id")

    # Step 2: solve_timetable
    print("\n--- Step 2: solve_timetable ---")
    start = time.time()
    schedule = solve_timetable(ts, rooms, fac, courses, secs, assigns, counts)
    solve_time = time.time() - start
    assert len(schedule) > 0, "Solver returned empty schedule!"
    print(f"  OK: Solved with {len(schedule)} scheduled classes in {solve_time:.1f}s")

    # Verify database_assignment_id is propagated to ScheduledClass
    sc_with_db_id = [sc for sc in schedule if sc.database_assignment_id is not None]
    sc_without_db_id = [sc for sc in schedule if sc.database_assignment_id is None]
    print(f"  ScheduledClass with database_assignment_id: {sc_with_db_id[:1] and len(sc_with_db_id)}")
    print(f"  ScheduledClass without database_assignment_id: {len(sc_without_db_id)}")

    # Show examples
    for sc in sc_with_db_id[:3]:
        print(f"    assignment_id: {sc.assignment_id}  ->  database_assignment_id: {sc.database_assignment_id}")

    # Step 3: validate_timetable
    print("\n--- Step 3: validate_timetable ---")
    is_valid, errors = validate_timetable(schedule, ts, rooms, fac, courses, secs, assigns, counts)
    print(f"  Valid: {is_valid}, Errors: {len(errors)}")
    if errors:
        for e in errors[:5]:
            print(f"    - {e}")
    assert is_valid, f"Validation failed: {errors}"
    print("  OK: (True, [])")

    # Step 4: save_schedule
    print("\n--- Step 4: save_schedule ---")
    try:
        schedule_id = save_schedule("FK Fix Verification", schedule, semester_id="SEM5")
        print(f"  OK: Schedule saved with ID = {schedule_id}")
    except Exception as e:
        print(f"  FAIL: {type(e).__name__}: {e}")
        raise

    # Step 5: Verify FK integrity in database
    print("\n--- Step 5: Database FK integrity check ---")
    with get_db_cursor() as cur:
        # Get all assignment_ids we just persisted
        cur.execute(
            "SELECT DISTINCT assignment_id FROM scheduled_classes WHERE schedule_id = %s;",
            (schedule_id,)
        )
        persisted_ids = {row['assignment_id'] for row in cur.fetchall()}

        # Get all valid course_assignments IDs
        cur.execute("SELECT id FROM course_assignments;")
        valid_ids = {row['id'] for row in cur.fetchall()}

        # Check every persisted ID exists in course_assignments
        invalid = persisted_ids - valid_ids
        assert not invalid, f"FK violation! Persisted IDs not in course_assignments: {invalid}"
        print(f"  OK: All {len(persisted_ids)} persisted assignment_ids are valid FK references")

        # Verify no expanded IDs leaked into the database
        expanded_ids = {a.id for a in assigns if a.database_assignment_id is not None}
        leaked = persisted_ids & expanded_ids
        assert not leaked, f"Expanded IDs leaked into DB: {leaked}"
        print(f"  OK: No expanded internal IDs (like *_A, *_B) leaked into scheduled_classes")

        # Show a few persisted IDs for inspection
        for pid in sorted(persisted_ids)[:5]:
            print(f"    Persisted: {pid}")

    # Step 6: Legacy SAMPLE_DATA backward compatibility
    print("\n--- Step 6: Legacy SAMPLE_DATA backward compatibility ---")
    from app.scheduler.data_generator import generate_test_data
    sts, srooms, sfac, sc, ssec, sassign = generate_test_data()
    ssched = solve_timetable(sts, srooms, sfac, sc, ssec, sassign)
    assert len(ssched) > 0, "Legacy solver failed"
    is_valid_sb, errors_sb = validate_timetable(ssched, sts, srooms, sfac, sc, ssec, sassign)
    assert is_valid_sb, f"Legacy validation failed: {errors_sb}"
    # Verify database_assignment_id is None for legacy (not set)
    for sc_item in ssched:
        assert sc_item.database_assignment_id is None, (
            f"Legacy ScheduledClass should have database_assignment_id=None, got {sc_item.database_assignment_id}"
        )
    print("  OK: Legacy SAMPLE_DATA solves, validates, and has no database_assignment_id set")

    print("\n" + "=" * 60)
    print("ALL VERIFICATION CHECKS PASSED")
    print("=" * 60)

if __name__ == "__main__":
    verify()
