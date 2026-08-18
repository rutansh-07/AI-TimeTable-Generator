import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv
from typing import Tuple, List, Dict, Set

from app.scheduler.models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment, ScheduledClass

# Load environment variables (useful for local development with .env)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

@contextmanager
def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set. Please check your config.")
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

def get_scheduler_input() -> Tuple[List[TimeSlot], List[Room], List[Faculty], List[Course], List[Section], List[CourseAssignment]]:
    """
    Fetches all configuration and input data from the PostgreSQL database
    and maps them to internal dataclasses used by the OR-Tools scheduling engine.
    """
    with get_db_cursor() as cursor:
        # 1. Fetch Timeslots
        cursor.execute("SELECT id, day, time FROM timeslots ORDER BY id;")
        db_timeslots = cursor.fetchall()
        timeslots = [TimeSlot(id=t['id'], day=t['day'], time=t['time']) for t in db_timeslots]
        all_timeslot_ids = {t.id for t in timeslots}

        # 2. Fetch Rooms
        cursor.execute("SELECT id, name, capacity, is_lab FROM rooms ORDER BY id;")
        db_rooms = cursor.fetchall()
        rooms = [Room(id=r['id'], name=r['name'], capacity=r['capacity'], is_lab=r['is_lab']) for r in db_rooms]

        # 3. Fetch Courses
        cursor.execute("SELECT id, name, requires_lab FROM courses ORDER BY id;")
        db_courses = cursor.fetchall()
        courses = [Course(id=c['id'], name=c['name'], requires_lab=c['requires_lab']) for c in db_courses]

        # 4. Fetch Sections
        cursor.execute("SELECT id, name, student_count FROM sections ORDER BY id;")
        db_sections = cursor.fetchall()
        sections = [Section(id=s['id'], name=s['name'], student_count=s['student_count']) for s in db_sections]

        # 5. Fetch Faculty (and their availability/preferences)
        cursor.execute("SELECT id, name FROM faculty ORDER BY id;")
        db_faculty = cursor.fetchall()

        cursor.execute("SELECT faculty_id, timeslot_id, is_preferred FROM faculty_availability;")
        db_availability = cursor.fetchall()

        # Group availability and preferences
        avail_map: Dict[str, Set[int]] = {}
        pref_map: Dict[str, Set[int]] = {}
        
        # Initialize for all faculty members
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
            # If no availability is specified in the DB, default to all timeslots
            f_avail = avail_map[f_id] if avail_map[f_id] else set(all_timeslot_ids)
            f_pref = pref_map[f_id]
            faculty_list.append(Faculty(id=f_id, name=f['name'], available_timeslots=f_avail, preferred_timeslots=f_pref))

        # 6. Fetch Assignments
        cursor.execute("SELECT id, section_id, course_id, faculty_id, weekly_periods FROM course_assignments ORDER BY id;")
        db_assignments = cursor.fetchall()
        assignments = [
            CourseAssignment(
                id=a['id'],
                section_id=a['section_id'],
                course_id=a['course_id'],
                faculty_id=a['faculty_id'],
                weekly_periods=a['weekly_periods']
            )
            for a in db_assignments
        ]

    return timeslots, rooms, faculty_list, courses, sections, assignments

def save_schedule(name: str, schedule: List[ScheduledClass]) -> str:
    """
    Saves a generated schedule to the database, setting it as active,
    and deactivating previous schedules.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            try:
                # 1. Deactivate all existing schedules
                cursor.execute("UPDATE schedules SET is_active = FALSE;")
                
                # 2. Insert new schedule metadata
                cursor.execute(
                    "INSERT INTO schedules (name, is_active) VALUES (%s, TRUE) RETURNING id;",
                    (name,)
                )
                schedule_id = cursor.fetchone()[0]
                
                # 3. Insert individual scheduled classes
                if schedule:
                    insert_query = """
                        INSERT INTO scheduled_classes (schedule_id, assignment_id, period_idx, timeslot_id, room_id)
                        VALUES (%s, %s, %s, %s, %s);
                    """
                    data = [
                        (schedule_id, sc.assignment_id, sc.period_idx, sc.timeslot_id, sc.room_id)
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
            SELECT sc.assignment_id, sc.period_idx, sc.timeslot_id, sc.room_id 
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
                room_id=row['room_id']
            )
            for row in rows
        ]
