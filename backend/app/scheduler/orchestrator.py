from typing import Tuple, List, Dict
from app.db.connection import get_scheduler_input_for_semester, get_section_lab_batches
from app.scheduler.models import TimeSlot, Room, Faculty, Course, Section, CourseAssignment

def prepare_semester_input(semester_id: str) -> Tuple[
    List[TimeSlot], List[Room], List[Faculty],
    List[Course], List[Section], List[CourseAssignment], Dict[str, int]
]:
    """
    Orchestrates the preparation of normalized scheduling input for a specific semester.
    Expands laboratory course assignments into batch-specific assignments.
    Returns standard solver inputs plus a dictionary of assignment effective student counts.
    """
    timeslots, rooms, faculty, courses, sections, raw_assignments = get_scheduler_input_for_semester(semester_id)
    
    course_map = {c.id: c for c in courses}
    section_map = {s.id: s for s in sections}
    
    # Load lab batches for all sections in this semester
    lab_batches_by_section = {}
    for s in sections:
        lab_batches_by_section[s.id] = get_section_lab_batches(s.id)
        
    final_assignments = []
    assignment_student_counts = {}
    
    for a in raw_assignments:
        c = course_map[a.course_id]
        s = section_map[a.section_id]
        
        if c.requires_lab:
            # Expand into lab batches if the section has them
            batches = lab_batches_by_section.get(s.id, [])
            if batches:
                for b in batches:
                    new_id = f"{a.id}_{b.batch_code}"
                    new_a = CourseAssignment(
                        id=new_id,
                        section_id=a.section_id,
                        course_id=a.course_id,
                        faculty_id=a.faculty_id,
                        weekly_periods=a.weekly_periods,
                        elective_group_id=a.elective_group_id,
                        lab_batch_id=b.id,
                        database_assignment_id=a.database_assignment_id or a.id
                    )
                    final_assignments.append(new_a)
                    assignment_student_counts[new_id] = b.student_count
            else:
                # If no batches found (e.g. sandbox data or incomplete setup), keep original
                final_assignments.append(a)
                assignment_student_counts[a.id] = s.student_count
        else:
            final_assignments.append(a)
            assignment_student_counts[a.id] = s.student_count
            
    return timeslots, rooms, faculty, courses, sections, final_assignments, assignment_student_counts
