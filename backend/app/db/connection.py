"""
Database connection and query layer for the CredWeave AI Timetable Generator.

All original functions are fully preserved for backward compatibility:
  - get_scheduler_input()  — used by /api/timetable/generate-db
  - save_schedule()        — used by /api/timetable/generate-db
  - get_active_schedule()  — used by /api/timetable/active

New functions added for the hierarchical academic model:
  - get_semesters()
  - get_departments()
  - get_semester_sections()
  - get_section_lab_batches()
  - get_semester_hierarchy_summary()

DATA NOTE: All data returned by these functions reflects the seed data
classification (SYNTHETIC/DEMO where indicated in seed.sql).
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv
from typing import Tuple, List, Dict, Set, Optional

from app.scheduler.models import (
    TimeSlot, Room, Faculty, Course, Section, CourseAssignment, ScheduledClass,
    Semester, Department, LabBatch, Student, ElectiveGroup,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


@contextmanager
def get_db_connection():
    if not DATABASE_URL:
        raise ValueError(
            "DATABASE_URL environment variable is not set. "
            "Please check your .env file or environment configuration."
        )
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_db_cursor(commit=False):
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()


# ─────────────────────────────────────────────────────────────────────────────
# ORIGINAL SOLVER INPUT/OUTPUT FUNCTIONS (preserved — do not modify)
# ─────────────────────────────────────────────────────────────────────────────

def get_scheduler_input() -> Tuple[
    List[TimeSlot], List[Room], List[Faculty],
    List[Course], List[Section], List[CourseAssignment]
]:
    """
    Fetches all configuration and input data from the PostgreSQL database
    and maps them to internal dataclasses used by the OR-Tools scheduling engine.

    This function is used by the /api/timetable/generate-db endpoint.
    It loads ALL course assignments regardless of semester (original behaviour).
    For semester-isolated solving, use get_scheduler_input_for_semester().
    """
    with get_db_cursor() as cursor:
        # 1. Fetch Timeslots
        cursor.execute("SELECT id, day, time FROM timeslots ORDER BY id;")
        db_timeslots = cursor.fetchall()
        timeslots = [TimeSlot(id=t['id'], day=t['day'], time=t['time']) for t in db_timeslots]
        all_timeslot_ids = {t.id for t in timeslots}

        # 2. Fetch Rooms
        cursor.execute("SELECT id, name, capacity, is_lab, room_type FROM rooms ORDER BY id;")
        db_rooms = cursor.fetchall()
        rooms = [
            Room(
                id=r['id'], name=r['name'], capacity=r['capacity'],
                is_lab=r['is_lab'], room_type=r.get('room_type', '')
            )
            for r in db_rooms
        ]

        # 3. Fetch Courses
        cursor.execute(
            "SELECT id, name, requires_lab, course_code, credits, course_type, "
            "       weekly_hours, semester_id, department_id, is_elective "
            "FROM courses ORDER BY id;"
        )
        db_courses = cursor.fetchall()
        courses = [
            Course(
                id=c['id'], name=c['name'], requires_lab=c['requires_lab'],
                course_code=c.get('course_code', ''),
                credits=c.get('credits', 0),
                course_type=c.get('course_type', 'theory'),
                weekly_hours=c.get('weekly_hours', 0),
                semester_id=c.get('semester_id') or '',
                department_id=c.get('department_id') or '',
                is_elective=c.get('is_elective', False),
            )
            for c in db_courses
        ]

        # 4. Fetch Sections
        cursor.execute(
            "SELECT id, name, student_count, semester_id, department_id, section_code "
            "FROM sections ORDER BY id;"
        )
        db_sections = cursor.fetchall()
        sections = [
            Section(
                id=s['id'], name=s['name'], student_count=s['student_count'],
                semester_id=s.get('semester_id') or '',
                department_id=s.get('department_id') or '',
                section_code=s.get('section_code') or '',
            )
            for s in db_sections
        ]

        # 5. Fetch Faculty (and their availability/preferences)
        cursor.execute("SELECT id, name, department_id FROM faculty ORDER BY id;")
        db_faculty = cursor.fetchall()

        cursor.execute("SELECT faculty_id, timeslot_id, is_preferred FROM faculty_availability;")
        db_availability = cursor.fetchall()

        avail_map: Dict[str, Set[int]] = {}
        pref_map: Dict[str, Set[int]] = {}

        for f in db_faculty:
            avail_map[f['id']] = set()
            pref_map[f['id']] = set()

        for av in db_availability:
            f_id = av['faculty_id']
            t_id = av['timeslot_id']
            is_pref = av['is_preferred']
            if f_id in avail_map:
                avail_map[f_id].add(t_id)
                if is_pref:
                    pref_map[f_id].add(t_id)

        faculty_list = []
        for f in db_faculty:
            f_id = f['id']
            # If no availability rows exist, default to all timeslots (backward compat)
            f_avail = avail_map[f_id] if avail_map[f_id] else set(all_timeslot_ids)
            f_pref = pref_map[f_id]
            faculty_list.append(Faculty(
                id=f_id, name=f['name'],
                available_timeslots=f_avail,
                preferred_timeslots=f_pref,
                department_id=f.get('department_id') or '',
            ))

        # 6. Fetch Assignments
        cursor.execute(
            "SELECT id, section_id, course_id, faculty_id, weekly_periods, "
            "       elective_group_id, lab_batch_id "
            "FROM course_assignments ORDER BY id;"
        )
        db_assignments = cursor.fetchall()
        assignments = [
            CourseAssignment(
                id=a['id'],
                section_id=a['section_id'],
                course_id=a['course_id'],
                faculty_id=a['faculty_id'],
                weekly_periods=a['weekly_periods'],
                elective_group_id=a.get('elective_group_id') or '',
                lab_batch_id=a.get('lab_batch_id') or '',
            )
            for a in db_assignments
        ]

    return timeslots, rooms, faculty_list, courses, sections, assignments


def save_schedule(name: str, schedule: List[ScheduledClass], semester_id: Optional[str] = None) -> str:
    """
    Saves a generated schedule to the database, setting it as active,
    and deactivating previous schedules.

    semester_id is optional. When provided, it links the saved schedule
    to a specific semester for isolation queries.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            try:
                cursor.execute("UPDATE schedules SET is_active = FALSE;")
                cursor.execute(
                    "INSERT INTO schedules (name, is_active, semester_id) "
                    "VALUES (%s, TRUE, %s) RETURNING id;",
                    (name, semester_id)
                )
                schedule_id = cursor.fetchone()[0]

                if schedule:
                    insert_query = """
                        INSERT INTO scheduled_classes
                            (schedule_id, assignment_id, lab_batch_id, period_idx, timeslot_id, room_id)
                        VALUES (%s, %s, %s, %s, %s, %s);
                    """
                    data = [
                        (
                            schedule_id, 
                            sc.database_assignment_id or sc.assignment_id, 
                            sc.lab_batch_id if sc.lab_batch_id else None,
                            sc.period_idx, 
                            sc.timeslot_id, 
                            sc.room_id
                        )
                        for sc in schedule
                    ]
                    cursor.executemany(insert_query, data)

                conn.commit()
                return str(schedule_id)
            except Exception as e:
                conn.rollback()
                raise e


def get_active_schedule() -> List[ScheduledClass]:
    """
    Fetches the currently active schedule from the database.
    """
    with get_db_cursor() as cursor:
        query = """
            SELECT sc.assignment_id, sc.lab_batch_id, sc.period_idx, sc.timeslot_id, sc.room_id
            FROM scheduled_classes sc
            JOIN schedules s ON sc.schedule_id = s.id
            WHERE s.is_active = TRUE;
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        return [
            ScheduledClass(
                assignment_id=row['assignment_id'],
                period_idx=row['period_idx'],
                timeslot_id=row['timeslot_id'],
                room_id=row['room_id'],
                lab_batch_id=row['lab_batch_id']
            )
            for row in rows
        ]


# ─────────────────────────────────────────────────────────────────────────────
# NEW HIERARCHICAL QUERY FUNCTIONS
# These support the CredWeave NEP 2020 academic data model.
# Not yet called by the solver — used by future API endpoints and orchestration.
# ─────────────────────────────────────────────────────────────────────────────

def get_semesters() -> List[Semester]:
    """Returns all semesters ordered by semester_number."""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, semester_number, name, academic_year, is_active "
            "FROM semesters ORDER BY semester_number;"
        )
        rows = cursor.fetchall()
        return [
            Semester(
                id=r['id'],
                semester_number=r['semester_number'],
                name=r['name'],
                academic_year=r['academic_year'],
                is_active=r['is_active'],
            )
            for r in rows
        ]


def get_departments() -> List[Department]:
    """Returns all departments ordered by code."""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, code, name FROM departments ORDER BY code;")
        rows = cursor.fetchall()
        return [
            Department(id=r['id'], code=r['code'], name=r['name'])
            for r in rows
        ]


def get_semester_sections(semester_id: str) -> List[Section]:
    """Returns all sections belonging to a specific semester."""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, name, student_count, semester_id, department_id, section_code "
            "FROM sections WHERE semester_id = %s ORDER BY department_id, name;",
            (semester_id,)
        )
        rows = cursor.fetchall()
        return [
            Section(
                id=r['id'], name=r['name'], student_count=r['student_count'],
                semester_id=r.get('semester_id') or '',
                department_id=r.get('department_id') or '',
                section_code=r.get('section_code') or '',
            )
            for r in rows
        ]


def get_section_lab_batches(section_id: str) -> List[LabBatch]:
    """Returns all lab batches for a given section, ordered by batch_code."""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, section_id, batch_code, student_count "
            "FROM lab_batches WHERE section_id = %s ORDER BY batch_code;",
            (section_id,)
        )
        rows = cursor.fetchall()
        return [
            LabBatch(
                id=r['id'],
                section_id=r['section_id'],
                batch_code=r['batch_code'],
                student_count=r['student_count'],
            )
            for r in rows
        ]


def get_semester_elective_groups(semester_id: str) -> List[ElectiveGroup]:
    """Returns all elective groups for a specific semester."""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, semester_id, course_id, name, capacity, enrolled_count "
            "FROM elective_groups WHERE semester_id = %s ORDER BY course_id, name;",
            (semester_id,)
        )
        rows = cursor.fetchall()
        return [
            ElectiveGroup(
                id=r['id'],
                semester_id=r['semester_id'],
                course_id=r['course_id'],
                name=r['name'],
                capacity=r['capacity'],
                enrolled_count=r['enrolled_count'],
            )
            for r in rows
        ]


def get_semester_hierarchy_summary(semester_id: str) -> dict:
    """
    Returns a structured summary of the academic hierarchy for a semester.
    Used by the /api/hierarchy/{semester_id} endpoint (to be added in Step 3).

    Returns a dict with:
      semester, departments, sections, total_sections, total_students,
      lab_batches, total_lab_batches, courses, elective_groups
    """
    with get_db_cursor() as cursor:
        # Semester info
        cursor.execute(
            "SELECT id, semester_number, name, academic_year, is_active "
            "FROM semesters WHERE id = %s;",
            (semester_id,)
        )
        sem_row = cursor.fetchone()
        if not sem_row:
            raise ValueError(f"Semester '{semester_id}' not found in database.")

        # Departments present in this semester
        cursor.execute(
            """
            SELECT DISTINCT d.id, d.code, d.name
            FROM departments d
            JOIN sections s ON s.department_id = d.id
            WHERE s.semester_id = %s
            ORDER BY d.code;
            """,
            (semester_id,)
        )
        dept_rows = cursor.fetchall()

        # Sections summary
        cursor.execute(
            """
            SELECT s.id, s.name, s.student_count, s.department_id, s.section_code,
                   d.code AS dept_code,
                   COUNT(lb.id) AS batch_count
            FROM sections s
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN lab_batches lb ON lb.section_id = s.id
            WHERE s.semester_id = %s
            GROUP BY s.id, s.name, s.student_count, s.department_id, s.section_code, d.code
            ORDER BY s.department_id, s.name;
            """,
            (semester_id,)
        )
        section_rows = cursor.fetchall()

        # Course count
        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM courses WHERE semester_id = %s;",
            (semester_id,)
        )
        course_count = cursor.fetchone()['cnt']

        # Faculty count (those who have assignments for this semester's sections)
        cursor.execute(
            """
            SELECT COUNT(DISTINCT ca.faculty_id) AS cnt
            FROM course_assignments ca
            JOIN sections s ON ca.section_id = s.id
            WHERE s.semester_id = %s;
            """,
            (semester_id,)
        )
        faculty_count = cursor.fetchone()['cnt']


        # Lab batches for this semester
        cursor.execute(
            """
            SELECT lb.id, lb.section_id, lb.batch_code, lb.student_count
            FROM lab_batches lb
            JOIN sections s ON lb.section_id = s.id
            WHERE s.semester_id = %s
            ORDER BY s.id, lb.batch_code;
            """,
            (semester_id,)
        )
        batch_rows = cursor.fetchall()
        batches_by_section = {}
        for b in batch_rows:
            batches_by_section.setdefault(b['section_id'], []).append(dict(b))

        # Course assignments with course & faculty info for sections in this semester
        cursor.execute(
            """
            SELECT ca.id, ca.section_id, ca.course_id, ca.faculty_id, ca.weekly_periods,
                   ca.elective_group_id, ca.lab_batch_id,
                   c.name AS course_name, c.course_code, c.course_type, c.requires_lab, c.is_elective,
                   f.name AS faculty_name,
                   d.code AS dept_code
            FROM course_assignments ca
            JOIN sections s ON ca.section_id = s.id
            JOIN courses c ON ca.course_id = c.id
            JOIN faculty f ON ca.faculty_id = f.id
            LEFT JOIN departments d ON c.department_id = d.id
            WHERE s.semester_id = %s
            ORDER BY ca.id;
            """,
            (semester_id,)
        )
        ca_rows = cursor.fetchall()
        assignments_by_section = {}
        for ca in ca_rows:
            assignments_by_section.setdefault(ca['section_id'], []).append(dict(ca))

        # Elective groups and their options in this semester
        cursor.execute(
            """
            SELECT eg.id, eg.semester_id, eg.course_id, eg.name, eg.capacity, eg.enrolled_count
            FROM elective_groups eg
            WHERE eg.semester_id = %s
            ORDER BY eg.id;
            """,
            (semester_id,)
        )
        eg_rows = cursor.fetchall()
        
        elective_groups_list = []
        for eg in eg_rows:
            # Find all assignments linked to this elective group
            eg_assigns = [ca for ca in ca_rows if ca.get('elective_group_id') == eg['id']]
            options = []
            for ea in eg_assigns:
                options.append({
                    "assignment_id": ea['id'],
                    "section_id": ea['section_id'],
                    "course_id": ea['course_id'],
                    "course_name": ea['course_name'],
                    "course_code": ea['course_code'],
                    "dept_code": ea.get('dept_code') or "NEP/Cross",
                    "faculty_id": ea['faculty_id'],
                    "faculty_name": ea['faculty_name'],
                    "weekly_periods": ea['weekly_periods'],
                })
            
            eg_dict = dict(eg)
            eg_dict['options'] = options
            elective_groups_list.append(eg_dict)

        # Department breakdown
        dept_list = []
        for d in dept_rows:
            d_sections = [r for r in section_rows if r['department_id'] == d['id']]
            dept_list.append({
                "id": d['id'],
                "code": d['code'],
                "name": d['name'],
                "section_count": len(d_sections),
                "student_count": sum(r['student_count'] for r in d_sections),
                "sections": [dict(r) for r in d_sections]
            })

        # Enrich sections with their batches and assignments
        enriched_sections = []
        for r in section_rows:
            s_dict = dict(r)
            s_dict['lab_batches'] = batches_by_section.get(r['id'], [])
            s_dict['assignments'] = assignments_by_section.get(r['id'], [])
            enriched_sections.append(s_dict)

    total_students = sum(r['student_count'] for r in section_rows)
    total_batches = sum(r['batch_count'] for r in section_rows)

    return {
        "semester_id": sem_row['id'],
        "semester_number": sem_row['semester_number'],
        "semester_name": sem_row['name'],
        "academic_year": sem_row['academic_year'],
        "is_active": sem_row['is_active'],
        "total_departments": len(dept_list),
        "total_sections": len(section_rows),
        "total_students": total_students,
        "total_lab_batches": total_batches,
        "total_courses": course_count,
        "total_elective_groups": len(eg_rows),
        "total_faculty_assigned": faculty_count,
        "departments": dept_list,
        "sections": enriched_sections,
        "elective_groups": elective_groups_list,
        "data_classification": "SYNTHETIC/DEMO — Not live institutional data",
    }



def get_scheduler_input_for_semester(semester_id: str) -> Tuple[
    List[TimeSlot], List[Room], List[Faculty],
    List[Course], List[Section], List[CourseAssignment]
]:
    """
    Semester-isolated version of get_scheduler_input().

    Returns only the courses, sections, and assignments belonging to the
    specified semester. This prevents cross-semester data contamination.

    NOTE: This function is prepared for Step 2 (full solver integration).
          It is not yet called by any active API endpoint.
          The sandbox /api/timetable/generate-db continues to use
          get_scheduler_input() which loads all data (original behaviour).
    """
    with get_db_cursor() as cursor:
        # Timeslots — all timeslots are shared across semesters
        cursor.execute("SELECT id, day, time FROM timeslots ORDER BY id;")
        db_timeslots = cursor.fetchall()
        timeslots = [TimeSlot(id=t['id'], day=t['day'], time=t['time']) for t in db_timeslots]
        all_timeslot_ids = {t.id for t in timeslots}

        # Rooms — all rooms shared across semesters
        cursor.execute("SELECT id, name, capacity, is_lab, room_type FROM rooms ORDER BY id;")
        db_rooms = cursor.fetchall()
        rooms = [
            Room(
                id=r['id'], name=r['name'], capacity=r['capacity'],
                is_lab=r['is_lab'], room_type=r.get('room_type', '')
            )
            for r in db_rooms
        ]

        # Courses — filtered to this semester only
        cursor.execute(
            "SELECT id, name, requires_lab, course_code, credits, course_type, "
            "       weekly_hours, semester_id, department_id, is_elective "
            "FROM courses WHERE semester_id = %s ORDER BY id;",
            (semester_id,)
        )
        db_courses = cursor.fetchall()
        courses = [
            Course(
                id=c['id'], name=c['name'], requires_lab=c['requires_lab'],
                course_code=c.get('course_code', ''),
                credits=c.get('credits', 0),
                course_type=c.get('course_type', 'theory'),
                weekly_hours=c.get('weekly_hours', 0),
                semester_id=c.get('semester_id') or '',
                department_id=c.get('department_id') or '',
                is_elective=c.get('is_elective', False),
            )
            for c in db_courses
        ]

        # Sections — filtered to this semester
        cursor.execute(
            "SELECT id, name, student_count, semester_id, department_id, section_code "
            "FROM sections WHERE semester_id = %s ORDER BY department_id, name;",
            (semester_id,)
        )
        db_sections = cursor.fetchall()
        sections = [
            Section(
                id=s['id'], name=s['name'], student_count=s['student_count'],
                semester_id=s.get('semester_id') or '',
                department_id=s.get('department_id') or '',
                section_code=s.get('section_code') or '',
            )
            for s in db_sections
        ]

        section_ids = {s.id for s in sections}
        course_ids = {c.id for c in courses}

        # Course assignments — only for this semester's sections and courses
        cursor.execute(
            "SELECT id, section_id, course_id, faculty_id, weekly_periods, "
            "       elective_group_id, lab_batch_id "
            "FROM course_assignments "
            "WHERE section_id = ANY(%s) AND course_id = ANY(%s) "
            "ORDER BY id;",
            (list(section_ids), list(course_ids))
        )
        db_assignments = cursor.fetchall()
        assignments = [
            CourseAssignment(
                id=a['id'],
                section_id=a['section_id'],
                course_id=a['course_id'],
                faculty_id=a['faculty_id'],
                weekly_periods=a['weekly_periods'],
                elective_group_id=a.get('elective_group_id') or '',
                lab_batch_id=a.get('lab_batch_id') or '',
            )
            for a in db_assignments
        ]

        # Faculty — only those assigned to this semester's courses
        faculty_ids = {a.faculty_id for a in assignments}
        if not faculty_ids:
            return timeslots, rooms, [], courses, sections, assignments

        cursor.execute(
            "SELECT id, name, department_id FROM faculty WHERE id = ANY(%s) ORDER BY id;",
            (list(faculty_ids),)
        )
        db_faculty = cursor.fetchall()

        cursor.execute(
            "SELECT faculty_id, timeslot_id, is_preferred "
            "FROM faculty_availability WHERE faculty_id = ANY(%s);",
            (list(faculty_ids),)
        )
        db_availability = cursor.fetchall()

        avail_map: Dict[str, Set[int]] = {f['id']: set() for f in db_faculty}
        pref_map: Dict[str, Set[int]] = {f['id']: set() for f in db_faculty}

        for av in db_availability:
            f_id = av['faculty_id']
            if f_id in avail_map:
                avail_map[f_id].add(av['timeslot_id'])
                if av['is_preferred']:
                    pref_map[f_id].add(av['timeslot_id'])

        faculty_list = [
            Faculty(
                id=f['id'], name=f['name'],
                available_timeslots=avail_map[f['id']] if avail_map[f['id']] else set(all_timeslot_ids),
                preferred_timeslots=pref_map[f['id']],
                department_id=f.get('department_id') or '',
            )
            for f in db_faculty
        ]

    return timeslots, rooms, faculty_list, courses, sections, assignments


def get_semester_faculty_details(semester_id: str) -> List[dict]:
    """
    Returns detailed teaching allocation and schedule info for faculty in a semester.
    Supports the read-only Faculty View (Step 4B).
    """
    with get_db_cursor() as cursor:
        # Get active schedule for this semester if available
        cursor.execute(
            """
            SELECT id FROM schedules 
            WHERE semester_id = %s AND is_active = TRUE 
            ORDER BY created_at DESC LIMIT 1;
            """,
            (semester_id,)
        )
        active_sched = cursor.fetchone()
        schedule_id = active_sched['id'] if active_sched else None

        # Fetch scheduled classes for this schedule if available
        sched_classes_by_assign = {}
        if schedule_id:
            cursor.execute(
                """
                SELECT sc.assignment_id, sc.lab_batch_id, sc.period_idx, sc.timeslot_id, sc.room_id,
                       t.day, t.time, r.name AS room_name, r.is_lab,
                       lb.batch_code AS sc_batch_code
                FROM scheduled_classes sc
                JOIN timeslots t ON sc.timeslot_id = t.id
                JOIN rooms r ON sc.room_id = r.id
                LEFT JOIN lab_batches lb ON sc.lab_batch_id = lb.id
                WHERE sc.schedule_id = %s
                ORDER BY sc.timeslot_id;
                """,
                (schedule_id,)
            )
            for row in cursor.fetchall():
                sched_classes_by_assign.setdefault(row['assignment_id'], []).append(dict(row))

        # Query all faculty assigned to courses for this semester's sections
        cursor.execute(
            """
            SELECT DISTINCT f.id, f.name, f.department_id, d.code AS dept_code, d.name AS dept_name
            FROM faculty f
            JOIN course_assignments ca ON ca.faculty_id = f.id
            JOIN sections s ON ca.section_id = s.id
            LEFT JOIN departments d ON f.department_id = d.id
            WHERE s.semester_id = %s
            ORDER BY d.code, f.name;
            """,
            (semester_id,)
        )
        faculty_rows = cursor.fetchall()

        # Query assignments for this semester
        cursor.execute(
            """
            SELECT ca.id, ca.faculty_id, ca.section_id, ca.course_id, ca.weekly_periods,
                   ca.elective_group_id, ca.lab_batch_id,
                   s.name AS section_name, s.student_count,
                   c.name AS course_name, c.course_code, c.course_type, c.requires_lab, c.is_elective,
                   d.code AS dept_code,
                   lb.batch_code
            FROM course_assignments ca
            JOIN sections s ON ca.section_id = s.id
            JOIN courses c ON ca.course_id = c.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN lab_batches lb ON ca.lab_batch_id = lb.id
            WHERE s.semester_id = %s
            ORDER BY ca.id;
            """,
            (semester_id,)
        )
        all_assignments = cursor.fetchall()
        assignments_by_faculty = {}
        for a in all_assignments:
            assignments_by_faculty.setdefault(a['faculty_id'], []).append(dict(a))

        faculty_list = []
        for f in faculty_rows:
            f_assigns = assignments_by_faculty.get(f['id'], [])
            total_periods = sum(a['weekly_periods'] for a in f_assigns)
            
            # Distinct courses & sections taught
            courses_taught = []
            seen_c = set()
            for a in f_assigns:
                if a['course_id'] not in seen_c:
                    courses_taught.append({
                        "course_id": a['course_id'],
                        "course_name": a['course_name'],
                        "course_code": a['course_code'],
                        "course_type": a['course_type'],
                        "requires_lab": a['requires_lab'],
                        "is_elective": a['is_elective'],
                    })
                    seen_c.add(a['course_id'])

            sections_taught = []
            seen_s = set()
            for a in f_assigns:
                if a['section_id'] not in seen_s:
                    sections_taught.append({
                        "section_id": a['section_id'],
                        "section_name": a['section_name'],
                        "dept_code": a['dept_code'],
                    })
                    seen_s.add(a['section_id'])

            # Gather all scheduled periods for this faculty member
            faculty_schedule = []
            for a in f_assigns:
                for sc in sched_classes_by_assign.get(a['id'], []):
                    faculty_schedule.append({
                        "assignment_id": a['id'],
                        "course_name": a['course_name'],
                        "course_code": a['course_code'],
                        "section_name": a['section_name'],
                        "batch_code": sc.get('sc_batch_code'),
                        "is_lab": sc['is_lab'],
                        "timeslot_id": sc['timeslot_id'],
                        "day": sc['day'],
                        "time": sc['time'],
                        "room_name": sc['room_name'],
                        "period_idx": sc['period_idx'],
                    })
            faculty_schedule.sort(key=lambda item: item['timeslot_id'])

            faculty_list.append({
                "id": f['id'],
                "name": f['name'],
                "department_id": f['department_id'],
                "dept_code": f['dept_code'] or "",
                "dept_name": f['dept_name'] or "",
                "total_weekly_periods": total_periods,
                "assigned_courses": courses_taught,
                "assigned_sections": sections_taught,
                "teaching_assignments": f_assigns,
                "schedule": faculty_schedule,
                "has_schedule": len(faculty_schedule) > 0,
            })

        return faculty_list


def get_semester_student_details(semester_id: str) -> List[dict]:
    """
    Returns detailed student list, lab batch info, elective enrollment, and curriculum for a semester.
    Supports the read-only Student View (Step 4B).
    """
    with get_db_cursor() as cursor:
        # Get active schedule for this semester if available
        cursor.execute(
            """
            SELECT id FROM schedules 
            WHERE semester_id = %s AND is_active = TRUE 
            ORDER BY created_at DESC LIMIT 1;
            """,
            (semester_id,)
        )
        active_sched = cursor.fetchone()
        schedule_id = active_sched['id'] if active_sched else None

        # Fetch scheduled classes by assignment_id if schedule exists
        sched_classes_by_assign = {}
        if schedule_id:
            cursor.execute(
                """
                SELECT sc.assignment_id, sc.lab_batch_id, sc.period_idx, sc.timeslot_id, sc.room_id,
                       t.day, t.time, r.name AS room_name, r.is_lab
                FROM scheduled_classes sc
                JOIN timeslots t ON sc.timeslot_id = t.id
                JOIN rooms r ON sc.room_id = r.id
                WHERE sc.schedule_id = %s
                ORDER BY sc.timeslot_id;
                """,
                (schedule_id,)
            )
            for row in cursor.fetchall():
                sched_classes_by_assign.setdefault(row['assignment_id'], []).append(dict(row))

        # Query all students in this semester
        cursor.execute(
            """
            SELECT s.id, s.roll_number, s.name, s.section_id, s.semester_id, s.lab_batch_id,
                   sec.name AS section_name, sec.section_code,
                   d.code AS dept_code, d.name AS dept_name,
                   lb.batch_code, lb.student_count AS batch_student_count
            FROM students s
            JOIN sections sec ON s.section_id = sec.id
            LEFT JOIN departments d ON sec.department_id = d.id
            LEFT JOIN lab_batches lb ON s.lab_batch_id = lb.id
            WHERE s.semester_id = %s
            ORDER BY sec.name, lb.batch_code, s.roll_number;
            """,
            (semester_id,)
        )
        student_rows = cursor.fetchall()

        # Query student elective selections for this semester
        cursor.execute(
            """
            SELECT ses.student_id, ses.elective_group_id, eg.name AS elective_group_name, eg.capacity
            FROM student_elective_selections ses
            JOIN elective_groups eg ON ses.elective_group_id = eg.id
            WHERE eg.semester_id = %s;
            """,
            (semester_id,)
        )
        elective_sel_rows = cursor.fetchall()
        elective_by_student = {row['student_id']: dict(row) for row in elective_sel_rows}

        # Query all elective groups in this semester to show available elective options
        cursor.execute(
            """
            SELECT eg.id, eg.name, eg.capacity, eg.enrolled_count
            FROM elective_groups eg
            WHERE eg.semester_id = %s
            ORDER BY eg.id;
            """,
            (semester_id,)
        )
        all_elective_groups = [dict(r) for r in cursor.fetchall()]

        # Query course assignments for this semester
        cursor.execute(
            """
            SELECT ca.id, ca.section_id, ca.course_id, ca.faculty_id, ca.weekly_periods,
                   ca.elective_group_id, ca.lab_batch_id,
                   c.name AS course_name, c.course_code, c.course_type, c.requires_lab, c.is_elective,
                   f.name AS faculty_name
            FROM course_assignments ca
            JOIN sections s ON ca.section_id = s.id
            JOIN courses c ON ca.course_id = c.id
            JOIN faculty f ON ca.faculty_id = f.id
            WHERE s.semester_id = %s
            ORDER BY ca.id;
            """,
            (semester_id,)
        )
        ca_rows = cursor.fetchall()
        assignments_by_section = {}
        for ca in ca_rows:
            assignments_by_section.setdefault(ca['section_id'], []).append(dict(ca))

        students_list = []
        for stu in student_rows:
            sec_assigns = assignments_by_section.get(stu['section_id'], [])
            
            # Compulsory section courses (Theory + Student's matching lab batch)
            compulsory_courses = []
            for a in sec_assigns:
                if not a.get('elective_group_id'):
                    # If it's a lab batch assignment, only include if it matches student's lab_batch_id or if no batch assigned
                    if a.get('lab_batch_id'):
                        if a['lab_batch_id'] == stu['lab_batch_id']:
                            compulsory_courses.append(a)
                    else:
                        compulsory_courses.append(a)

            # Elective enrollment
            elec_enrollment = elective_by_student.get(stu['id'])

            # Personalized schedule for this student
            student_schedule = []
            # 1. Classes for compulsory courses
            for a in compulsory_courses:
                for sc in sched_classes_by_assign.get(a['id'], []):
                    if sc.get('lab_batch_id') and sc['lab_batch_id'] != stu['lab_batch_id']:
                        continue
                    student_schedule.append({
                        "assignment_id": a['id'],
                        "course_name": a['course_name'],
                        "course_code": a['course_code'],
                        "is_lab": sc['is_lab'],
                        "is_elective": False,
                        "faculty_name": a['faculty_name'],
                        "timeslot_id": sc['timeslot_id'],
                        "day": sc['day'],
                        "time": sc['time'],
                        "room_name": sc['room_name'],
                    })
            # 2. Classes for their enrolled elective group (if enrolled)
            if elec_enrollment:
                eg_id = elec_enrollment['elective_group_id']
                for a in sec_assigns:
                    if a.get('elective_group_id') == eg_id:
                        for sc in sched_classes_by_assign.get(a['id'], []):
                            if sc.get('lab_batch_id') and sc['lab_batch_id'] != stu['lab_batch_id']:
                                continue
                            student_schedule.append({
                                "assignment_id": a['id'],
                                "course_name": a['course_name'],
                                "course_code": a['course_code'],
                                "is_lab": sc['is_lab'],
                                "is_elective": True,
                                "elective_group_name": elec_enrollment['elective_group_name'],
                                "faculty_name": a['faculty_name'],
                                "timeslot_id": sc['timeslot_id'],
                                "day": sc['day'],
                                "time": sc['time'],
                                "room_name": sc['room_name'],
                            })
            student_schedule.sort(key=lambda item: item['timeslot_id'])

            students_list.append({
                "id": stu['id'],
                "roll_number": stu['roll_number'],
                "name": stu['name'],
                "section_id": stu['section_id'],
                "section_name": stu['section_name'],
                "dept_code": stu['dept_code'] or "",
                "dept_name": stu['dept_name'] or "",
                "semester_id": stu['semester_id'],
                "lab_batch_id": stu['lab_batch_id'] or "",
                "batch_code": stu['batch_code'] or "—",
                "enrolled_elective": elec_enrollment,
                "available_elective_groups": all_elective_groups,
                "compulsory_courses": compulsory_courses,
                "schedule": student_schedule,
                "has_schedule": len(student_schedule) > 0,
            })

        return students_list

