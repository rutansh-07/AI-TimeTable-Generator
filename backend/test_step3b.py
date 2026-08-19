import os
import sys

sys.path.insert(0, os.getcwd())

from app.scheduler.models import (
    TimeSlot, Room, Faculty, Course, Section, CourseAssignment, ScheduledClass
)
from app.scheduler.engine import solve_timetable
from app.scheduler.validator import validate_timetable
from app.scheduler.orchestrator import prepare_semester_input
from app.scheduler.data_generator import generate_test_data

def run_tests():
    print("==================================================")
    print("STEP 3B: CROSS-DEPARTMENT ELECTIVE GROUP TEST SUITE")
    print("==================================================")

    # Base test fixtures
    ts_list = [
        TimeSlot(id=0, day="Monday", time="09:10"),
        TimeSlot(id=1, day="Monday", time="10:10"),
        TimeSlot(id=2, day="Monday", time="12:10"),
        TimeSlot(id=3, day="Monday", time="13:10"),
        TimeSlot(id=4, day="Tuesday", time="09:10"),
        TimeSlot(id=5, day="Tuesday", time="10:10"),
    ]
    rooms = [
        Room(id="R101", name="Room 101", capacity=60, is_lab=False),
        Room(id="R102", name="Room 102", capacity=60, is_lab=False),
        Room(id="L101", name="Lab 101", capacity=30, is_lab=True),
        Room(id="L102", name="Lab 102", capacity=30, is_lab=True),
    ]
    avail_all = {t.id for t in ts_list}

    # ----------------------------------------------------
    print("\n=== TEST 1: Elective group from two different departments is synchronized to same timeslot ===")
    fac1 = Faculty(id="F_CSE", name="Prof. CSE", available_timeslots=avail_all, department_id="DEPT_CSE")
    fac2 = Faculty(id="F_IT", name="Prof. IT", available_timeslots=avail_all, department_id="DEPT_IT")
    c_elec1 = Course(id="C_CS", name="Cyber Security", requires_lab=False, department_id="DEPT_CSE", is_elective=True)
    c_elec2 = Course(id="C_BC", name="Blockchain", requires_lab=False, department_id="DEPT_IT", is_elective=True)
    sec_ce = Section(id="SEC_CE", name="CE Section", student_count=40, department_id="DEPT_CE")
    sec_it = Section(id="SEC_IT", name="IT Section", student_count=40, department_id="DEPT_IT")

    a1 = CourseAssignment(id="A_ELEC_CS", section_id="SEC_CE", course_id="C_CS", faculty_id="F_CSE", weekly_periods=2, elective_group_id="EG_TEST_1")
    a2 = CourseAssignment(id="A_ELEC_BC", section_id="SEC_IT", course_id="C_BC", faculty_id="F_IT", weekly_periods=2, elective_group_id="EG_TEST_1")

    sched = solve_timetable(
        timeslots=ts_list,
        rooms=rooms,
        faculty=[fac1, fac2],
        courses=[c_elec1, c_elec2],
        sections=[sec_ce, sec_it],
        assignments=[a1, a2],
    )
    assert len(sched) == 4, f"Expected 4 scheduled classes, got {len(sched)}"

    # Check period 0 synchronization
    sc_a1_p0 = next(sc for sc in sched if sc.assignment_id == "A_ELEC_CS" and sc.period_idx == 0)
    sc_a2_p0 = next(sc for sc in sched if sc.assignment_id == "A_ELEC_BC" and sc.period_idx == 0)
    assert sc_a1_p0.timeslot_id == sc_a2_p0.timeslot_id, (
        f"Period 0 not synchronized: A1 is at {sc_a1_p0.timeslot_id}, A2 is at {sc_a2_p0.timeslot_id}"
    )

    # Check period 1 synchronization
    sc_a1_p1 = next(sc for sc in sched if sc.assignment_id == "A_ELEC_CS" and sc.period_idx == 1)
    sc_a2_p1 = next(sc for sc in sched if sc.assignment_id == "A_ELEC_BC" and sc.period_idx == 1)
    assert sc_a1_p1.timeslot_id == sc_a2_p1.timeslot_id, (
        f"Period 1 not synchronized: A1 is at {sc_a1_p1.timeslot_id}, A2 is at {sc_a2_p1.timeslot_id}"
    )

    # Check that rooms are different (they cannot occupy the same room at the same time)
    assert sc_a1_p0.room_id != sc_a2_p0.room_id, "Different elective options must use different rooms!"
    assert sc_a1_p1.room_id != sc_a2_p1.room_id, "Different elective options must use different rooms!"

    is_valid, errors = validate_timetable(
        sched, ts_list, rooms, [fac1, fac2], [c_elec1, c_elec2], [sec_ce, sec_it], [a1, a2]
    )
    assert is_valid, f"Validation failed: {errors}"
    print("  PASS: Cross-department electives synchronized to exact same timeslots in distinct rooms.")

    # ----------------------------------------------------
    print("\n=== TEST 2: Two unrelated courses from different departments are NOT incorrectly synchronized ===")
    c_reg1 = Course(id="C_REG_CE", name="CE Theory", requires_lab=False, department_id="DEPT_CE", is_elective=False)
    c_reg2 = Course(id="C_REG_IT", name="IT Theory", requires_lab=False, department_id="DEPT_IT", is_elective=False)
    a_reg1 = CourseAssignment(id="A_REG_1", section_id="SEC_CE", course_id="C_REG_CE", faculty_id="F_CSE", weekly_periods=1, elective_group_id="")
    a_reg2 = CourseAssignment(id="A_REG_2", section_id="SEC_IT", course_id="C_REG_IT", faculty_id="F_IT", weekly_periods=1, elective_group_id="")

    # Force faculty 1 to only be available at timeslot 0, faculty 2 to only be available at timeslot 1
    fac1_restricted = Faculty(id="F_CSE", name="Prof. CSE", available_timeslots={0}, department_id="DEPT_CSE")
    fac2_restricted = Faculty(id="F_IT", name="Prof. IT", available_timeslots={1}, department_id="DEPT_IT")

    sched_unrel = solve_timetable(
        timeslots=ts_list,
        rooms=rooms,
        faculty=[fac1_restricted, fac2_restricted],
        courses=[c_reg1, c_reg2],
        sections=[sec_ce, sec_it],
        assignments=[a_reg1, a_reg2],
    )
    assert len(sched_unrel) == 2, "Unrelated courses should be solvable independently"
    sc_u1 = next(sc for sc in sched_unrel if sc.assignment_id == "A_REG_1")
    sc_u2 = next(sc for sc in sched_unrel if sc.assignment_id == "A_REG_2")
    assert sc_u1.timeslot_id == 0
    assert sc_u2.timeslot_id == 1
    assert sc_u1.timeslot_id != sc_u2.timeslot_id, "Unrelated courses must not be forced to same slot!"
    print("  PASS: Unrelated courses independently scheduled according to their own constraints.")

    # ----------------------------------------------------
    print("\n=== TEST 3: Elective course still obeys faculty/room constraints ===")
    # Faculty 1 only available at slots {4, 5}
    fac1_tue = Faculty(id="F_CSE", name="Prof. CSE", available_timeslots={4, 5}, department_id="DEPT_CSE")
    fac2_all = Faculty(id="F_IT", name="Prof. IT", available_timeslots=avail_all, department_id="DEPT_IT")

    sched_t3 = solve_timetable(
        timeslots=ts_list,
        rooms=rooms,
        faculty=[fac1_tue, fac2_all],
        courses=[c_elec1, c_elec2],
        sections=[sec_ce, sec_it],
        assignments=[
            CourseAssignment(id="A_ELEC_CS", section_id="SEC_CE", course_id="C_CS", faculty_id="F_CSE", weekly_periods=1, elective_group_id="EG_TEST_3"),
            CourseAssignment(id="A_ELEC_BC", section_id="SEC_IT", course_id="C_BC", faculty_id="F_IT", weekly_periods=1, elective_group_id="EG_TEST_3"),
        ],
    )
    assert len(sched_t3) == 2
    for sc in sched_t3:
        assert sc.timeslot_id in {4, 5}, f"Timeslot {sc.timeslot_id} violates faculty availability!"
    print("  PASS: Elective courses strictly obey faculty availability and room constraints.")

    # ----------------------------------------------------
    print("\n=== TEST 4: Elective lab obeys Step-2 continuous 2-period / same-room rule ===")
    sec_ce_small = Section(id="SEC_CE_S", name="CE Section Small", student_count=20, department_id="DEPT_CE")
    sec_it_small = Section(id="SEC_IT_S", name="IT Section Small", student_count=20, department_id="DEPT_IT")
    c_elec_lab = Course(id="C_LAB_ELEC", name="Applied AI Lab", requires_lab=True, department_id="DEPT_CSE", is_elective=True)
    c_elec_th = Course(id="C_TH_ELEC", name="Blockchain Theory", requires_lab=False, department_id="DEPT_IT", is_elective=True)
    a_elec_lab = CourseAssignment(id="A_ELEC_LAB", section_id="SEC_CE_S", course_id="C_LAB_ELEC", faculty_id="F_CSE", weekly_periods=2, elective_group_id="EG_TEST_LAB")
    a_elec_th = CourseAssignment(id="A_ELEC_TH", section_id="SEC_IT_S", course_id="C_TH_ELEC", faculty_id="F_IT", weekly_periods=2, elective_group_id="EG_TEST_LAB")

    sched_t4 = solve_timetable(
        timeslots=ts_list,
        rooms=rooms,
        faculty=[fac1, fac2],
        courses=[c_elec_lab, c_elec_th],
        sections=[sec_ce_small, sec_it_small],
        assignments=[a_elec_lab, a_elec_th],
    )
    assert len(sched_t4) == 4
    # Check lab continuous block: same day, contiguous slot, same lab room
    lab_sc0 = next(sc for sc in sched_t4 if sc.assignment_id == "A_ELEC_LAB" and sc.period_idx == 0)
    lab_sc1 = next(sc for sc in sched_t4 if sc.assignment_id == "A_ELEC_LAB" and sc.period_idx == 1)
    r_map = {r.id: r for r in rooms}
    assert r_map[lab_sc0.room_id].is_lab, "Elective lab must be in a lab room!"
    assert lab_sc0.room_id == lab_sc1.room_id, "Elective lab must use the same room for both periods!"
    # Contiguous: either (0, 1) or (2, 3) or (4, 5)
    assert (lab_sc0.timeslot_id, lab_sc1.timeslot_id) in [(0, 1), (2, 3), (4, 5)], (
        f"Lab not contiguous: {lab_sc0.timeslot_id} -> {lab_sc1.timeslot_id}"
    )

    # Check that theory elective period 0 is synchronized with lab elective period 0
    th_sc0 = next(sc for sc in sched_t4 if sc.assignment_id == "A_ELEC_TH" and sc.period_idx == 0)
    assert th_sc0.timeslot_id == lab_sc0.timeslot_id, "Elective theory period 0 must sync with lab elective period 0!"
    print("  PASS: Elective lab maintains continuous 2-hour block in same lab room while synchronizing start slot.")

    # ----------------------------------------------------
    print("\n=== TEST 5: Semester isolation: Elective groups in SEM5 do not affect SEM1 ===")
    ts_s1, r_s1, f_s1, c_s1, s_s1, a_s1, cnt_s1 = prepare_semester_input("SEM1")
    # In SEM1, courses should only be from SEM1 and have no SEM5 elective groups
    for c in c_s1:
        assert c.semester_id == "SEM1", f"Course {c.id} from {c.semester_id} in SEM1 input!"
    for a in a_s1:
        assert not a.elective_group_id.startswith("EG5_"), f"SEM5 elective group {a.elective_group_id} leaked to SEM1!"
    print("  PASS: Semester isolation verified. SEM1 contains zero SEM5 elective groups.")

    # ----------------------------------------------------
    print("\n=== TEST 6: Independent validator detects intentionally broken elective synchronization ===")
    # Construct invalid schedule where A1 is at slot 0 and A2 is at slot 4
    sc_bad1 = ScheduledClass(assignment_id="A_ELEC_CS", period_idx=0, timeslot_id=0, room_id="R101")
    sc_bad2 = ScheduledClass(assignment_id="A_ELEC_BC", period_idx=0, timeslot_id=4, room_id="R102")

    is_valid_bad, errors_bad = validate_timetable(
        schedule=[sc_bad1, sc_bad2],
        timeslots=ts_list,
        rooms=rooms,
        faculty=[fac1, fac2],
        courses=[c_elec1, c_elec2],
        sections=[sec_ce, sec_it],
        assignments=[
            CourseAssignment(id="A_ELEC_CS", section_id="SEC_CE", course_id="C_CS", faculty_id="F_CSE", weekly_periods=1, elective_group_id="EG_TEST_FAIL"),
            CourseAssignment(id="A_ELEC_BC", section_id="SEC_IT", course_id="C_BC", faculty_id="F_IT", weekly_periods=1, elective_group_id="EG_TEST_FAIL"),
        ],
    )
    assert not is_valid_bad, "Validator should have failed broken elective synchronization!"
    assert any("Elective synchronization violated" in e for e in errors_bad), (
        f"Expected elective sync violation error, got: {errors_bad}"
    )
    print("  PASS: Validator caught unsynchronized elective assignments.")

    # ----------------------------------------------------
    print("\n=== TEST 7: Legacy SAMPLE_DATA solves and validates without elective metadata ===")
    sts, srooms, sfac, sc, ssec, sassign = generate_test_data()
    ssched = solve_timetable(sts, srooms, sfac, sc, ssec, sassign)
    assert len(ssched) > 0, "Sandbox solver failed"
    is_valid_sb, errors_sb = validate_timetable(ssched, sts, srooms, sfac, sc, ssec, sassign)
    assert is_valid_sb, f"Sandbox validation failed: {errors_sb}"
    print("  PASS: Legacy SAMPLE_DATA solves and validates perfectly with zero regressions.")

    # ----------------------------------------------------
    print("\n=== TEST 8: Full SEM5 Generation with Cross-Department Elective Groups ===")
    ts_sem5, rooms_sem5, fac_sem5, courses_sem5, sections_sem5, assigns_sem5, counts_sem5 = prepare_semester_input("SEM5")
    
    # Check elective assignments in SEM5
    sem5_elective_assigns = [a for a in assigns_sem5 if a.elective_group_id]
    assert len(sem5_elective_assigns) == 6, f"Expected 6 elective assignments in SEM5, got {len(sem5_elective_assigns)}"
    unique_groups = {a.elective_group_id for a in sem5_elective_assigns}
    assert unique_groups == {"EG5_ELEC_GRP1", "EG5_ELEC_GRP2"}, f"Unexpected groups: {unique_groups}"

    print(f"Solving complete SEM5 problem ({len(assigns_sem5)} assignments, {len(sections_sem5)} sections, {len(unique_groups)} elective groups)...")
    sem5_schedule = solve_timetable(
        timeslots=ts_sem5,
        rooms=rooms_sem5,
        faculty=fac_sem5,
        courses=courses_sem5,
        sections=sections_sem5,
        assignments=assigns_sem5,
        assignment_student_counts=counts_sem5,
    )
    assert len(sem5_schedule) > 0, "SEM5 solver returned empty/infeasible schedule!"
    print(f"  OK: Solved with {len(sem5_schedule)} scheduled classes.")

    # Validate the full schedule independently
    is_valid_sem5, errors_sem5 = validate_timetable(
        schedule=sem5_schedule,
        timeslots=ts_sem5,
        rooms=rooms_sem5,
        faculty=fac_sem5,
        courses=courses_sem5,
        sections=sections_sem5,
        assignments=assigns_sem5,
        assignment_student_counts=counts_sem5,
    )
    if not is_valid_sem5:
        print("  FAIL: Validation errors found:")
        for err in errors_sem5:
            print("   -", err)
        assert False, "SEM5 timetable failed validation!"
    
    # Explicitly check elective synchronization in the solved schedule
    for gid in ["EG5_ELEC_GRP1", "EG5_ELEC_GRP2"]:
        g_assigns = [a for a in assigns_sem5 if a.elective_group_id == gid]
        for p in range(3): # 3 periods each
            slots = [
                next(sc.timeslot_id for sc in sem5_schedule if sc.assignment_id == a.id and sc.period_idx == p)
                for a in g_assigns
            ]
            assert len(set(slots)) == 1, f"Group {gid} period {p} not synchronized! Slots: {slots}"
            print(f"  OK: {gid} Period {p} synchronized across {len(g_assigns)} courses at timeslot {slots[0]}.")

    print(f"  PASS: SEM5 Master Timetable ({len(sem5_schedule)} classes) strictly verified with 0 hard conflicts.")
    print("\n==================================================")
    print("ALL STEP 3B REGRESSION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
