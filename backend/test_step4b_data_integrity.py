import os
import sys

sys.path.insert(0, os.getcwd())

from app.db.connection import get_db_cursor, get_semester_hierarchy_summary
from app.api.hierarchy import get_faculty_for_semester, get_students_for_semester

def run_tests():
    print("==================================================")
    print("STEP 4B-FIX: DATA INTEGRITY & COUNT VERIFICATION")
    print("==================================================")

    semesters = ["SEM1", "SEM2", "SEM3", "SEM4", "SEM5"]

    with get_db_cursor() as cur:
        # Check institutional faculty count
        cur.execute("SELECT COUNT(*) AS cnt FROM faculty;")
        total_inst_faculty_db = cur.fetchone()["cnt"]
        assert total_inst_faculty_db == 18, f"Expected 18 total faculty in DB, got {total_inst_faculty_db}"
        print(f"Total Institutional Faculty in DB: {total_inst_faculty_db} (VERIFIED FROM DATABASE)")

        for sem in semesters:
            print(f"\n--- Checking Semester {sem} ---")
            # 1. Sections count & sum(student_count)
            cur.execute("SELECT COUNT(*) AS cnt, COALESCE(SUM(student_count), 0) AS total_cohort FROM sections WHERE semester_id = %s;", (sem,))
            sec_res = cur.fetchone()
            db_sections = sec_res["cnt"]
            db_cohort_students = sec_res["total_cohort"]

            # 2. Lab batches count
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM lab_batches lb JOIN sections s ON lb.section_id = s.id WHERE s.semester_id = %s;",
                (sem,)
            )
            db_lab_batches = cur.fetchone()["cnt"]

            # 3. Students table rows count
            cur.execute("SELECT COUNT(*) AS cnt FROM students WHERE semester_id = %s;", (sem,))
            db_student_rows = cur.fetchone()["cnt"]

            # 4. Assigned faculty count
            cur.execute(
                """
                SELECT COUNT(DISTINCT ca.faculty_id) AS cnt 
                FROM course_assignments ca 
                JOIN sections s ON ca.section_id = s.id 
                WHERE s.semester_id = %s;
                """,
                (sem,)
            )
            db_assigned_faculty = cur.fetchone()["cnt"]

            # 5. Courses count
            cur.execute("SELECT COUNT(*) AS cnt FROM courses WHERE semester_id = %s;", (sem,))
            db_courses = cur.fetchone()["cnt"]

            # 6. Elective groups count
            cur.execute("SELECT COUNT(*) AS cnt FROM elective_groups WHERE semester_id = %s;", (sem,))
            db_elective_groups = cur.fetchone()["cnt"]

            print(f"  DB Facts: Sections={db_sections}, Cohort Sum={db_cohort_students}, Lab Batches={db_lab_batches}, Student Rows={db_student_rows}, Assigned Faculty={db_assigned_faculty}, Courses={db_courses}, Elective Groups={db_elective_groups}")

            # Verify Student Endpoint against DB
            student_resp = get_students_for_semester(sem)
            assert student_resp["total_registered_students"] == db_student_rows, (
                f"Student endpoint registered count ({student_resp['total_registered_students']}) != DB count ({db_student_rows})"
            )
            assert student_resp["cohort_student_count"] == db_cohort_students, (
                f"Student endpoint cohort count ({student_resp['cohort_student_count']}) != DB cohort sum ({db_cohort_students})"
            )
            assert len(student_resp["students"]) == db_student_rows, (
                f"Student endpoint array length ({len(student_resp['students'])}) != DB rows ({db_student_rows})"
            )
            print(f"  PASS: Student endpoint matches DB exact counts (Registered={db_student_rows}, Cohort={db_cohort_students})")

            # Verify Faculty Endpoint against DB
            faculty_resp = get_faculty_for_semester(sem)
            assert faculty_resp["total_assigned_faculty"] == db_assigned_faculty, (
                f"Faculty endpoint assigned count ({faculty_resp['total_assigned_faculty']}) != DB count ({db_assigned_faculty})"
            )
            assert faculty_resp["total_institutional_faculty"] == total_inst_faculty_db, (
                f"Faculty endpoint total institutional count ({faculty_resp['total_institutional_faculty']}) != DB total ({total_inst_faculty_db})"
            )
            assert len(faculty_resp["faculty"]) == db_assigned_faculty, (
                f"Faculty endpoint array length ({len(faculty_resp['faculty'])}) != DB assigned rows ({db_assigned_faculty})"
            )
            print(f"  PASS: Faculty endpoint matches DB exact counts (Assigned={db_assigned_faculty}, Institutional Total={total_inst_faculty_db})")

            # Verify Hierarchy Summary endpoint matches DB
            summary_resp = get_semester_hierarchy_summary(sem)
            assert summary_resp["total_sections"] == db_sections
            assert summary_resp["total_students"] == db_cohort_students
            assert summary_resp["total_lab_batches"] == db_lab_batches
            assert summary_resp["total_courses"] == db_courses
            assert summary_resp["total_faculty_assigned"] == db_assigned_faculty
            assert summary_resp["total_elective_groups"] == db_elective_groups
            print(f"  PASS: Hierarchy summary matches DB exact counts.")

    print("\n==================================================")
    print("ALL DATA INTEGRITY AND COUNT TESTS PASSED (100% MATCH)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
