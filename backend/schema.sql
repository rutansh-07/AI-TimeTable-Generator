-- ============================================================================
-- CredWeave AI Timetable Generator — Database Schema
-- SIH-25091 / CHA-229 — NEP 2020
-- ============================================================================
--
-- ARCHITECTURE LAYERS:
--   Layer 1 (ORIGINAL): timeslots, rooms, faculty, faculty_availability,
--                        courses, sections, course_assignments,
--                        schedules, scheduled_classes
--   Layer 2 (NEW):       semesters, departments, lab_batches, students,
--                        elective_groups, student_elective_selections
--
-- BACKWARD COMPATIBILITY:
--   All original tables are preserved unchanged.
--   The new tables are additive. Foreign key links from new tables to
--   original tables use optional references (NULL allowed on originals)
--   so existing queries against Layer 1 are unaffected.
--
-- DATA CLASSIFICATION:
--   Seed data generated from this schema is SYNTHETIC/DEMO data based on
--   the project specification. It is NOT live institutional data.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- CLEANUP (reverse dependency order)
-- ────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS student_elective_selections CASCADE;
DROP TABLE IF EXISTS students                       CASCADE;
DROP TABLE IF EXISTS elective_groups                CASCADE;
DROP TABLE IF EXISTS lab_batches                    CASCADE;
DROP TABLE IF EXISTS scheduled_classes              CASCADE;
DROP TABLE IF EXISTS schedules                      CASCADE;
DROP TABLE IF EXISTS course_assignments             CASCADE;
DROP TABLE IF EXISTS faculty_availability           CASCADE;
DROP TABLE IF EXISTS faculty                        CASCADE;
DROP TABLE IF EXISTS sections                       CASCADE;
DROP TABLE IF EXISTS courses                        CASCADE;
DROP TABLE IF EXISTS rooms                          CASCADE;
DROP TABLE IF EXISTS timeslots                      CASCADE;
DROP TABLE IF EXISTS departments                    CASCADE;
DROP TABLE IF EXISTS semesters                      CASCADE;

-- ============================================================================
-- LAYER 2 — HIERARCHICAL ACADEMIC STRUCTURE
-- ============================================================================

-- 1. Semesters
CREATE TABLE semesters (
    id              VARCHAR(20)  PRIMARY KEY,
    semester_number INTEGER      NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    name            VARCHAR(100) NOT NULL,
    academic_year   VARCHAR(20)  NOT NULL,     -- e.g. "2026-27"
    is_active       BOOLEAN      DEFAULT FALSE,
    UNIQUE (semester_number, academic_year)
);

-- 2. Departments
CREATE TABLE departments (
    id   VARCHAR(20)  PRIMARY KEY,
    code VARCHAR(10)  NOT NULL UNIQUE,         -- "CE", "CSE", "IT"
    name VARCHAR(100) NOT NULL
);

-- ============================================================================
-- LAYER 1 — ORIGINAL SOLVER TABLES (preserved, with optional new FK fields)
-- ============================================================================

-- 3. Timeslots
CREATE TABLE timeslots (
    id   INTEGER      PRIMARY KEY,
    day  VARCHAR(50)  NOT NULL,
    time VARCHAR(50)  NOT NULL
);

-- 4. Rooms
--    room_type: "lecture" | "lab" | "hall"
--    The is_lab boolean is kept for full backward compatibility.
CREATE TABLE rooms (
    id        VARCHAR(50)  PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    capacity  INTEGER      NOT NULL,
    is_lab    BOOLEAN      DEFAULT FALSE,
    room_type VARCHAR(20)  NOT NULL DEFAULT 'lecture'
                           CHECK (room_type IN ('lecture', 'lab', 'hall'))
);

-- 5. Courses
--    semester_id and department_id are nullable so existing sandbox records
--    with no semester remain valid.
CREATE TABLE courses (
    id             VARCHAR(50)  PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    requires_lab   BOOLEAN      DEFAULT FALSE,
    -- Extended fields
    course_code    VARCHAR(20)  NOT NULL DEFAULT '',
    credits        INTEGER      NOT NULL DEFAULT 0,
    course_type    VARCHAR(20)  NOT NULL DEFAULT 'theory'
                                CHECK (course_type IN ('theory', 'practical')),
    weekly_hours   INTEGER      NOT NULL DEFAULT 0,
    semester_id    VARCHAR(20)  REFERENCES semesters(id) ON DELETE SET NULL,
    department_id  VARCHAR(20)  REFERENCES departments(id) ON DELETE SET NULL,
    is_elective    BOOLEAN      DEFAULT FALSE
);

-- 6. Sections
--    semester_id and department_id are nullable for backward compatibility.
CREATE TABLE sections (
    id             VARCHAR(50)  PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    student_count  INTEGER      NOT NULL,
    -- Extended fields
    semester_id    VARCHAR(20)  REFERENCES semesters(id) ON DELETE SET NULL,
    department_id  VARCHAR(20)  REFERENCES departments(id) ON DELETE SET NULL,
    section_code   VARCHAR(20)  NOT NULL DEFAULT ''
);

-- 7. Faculty
CREATE TABLE faculty (
    id            VARCHAR(50)  PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    department_id VARCHAR(20)  REFERENCES departments(id) ON DELETE SET NULL
);

-- 8. Faculty Availability
CREATE TABLE faculty_availability (
    faculty_id   VARCHAR(50) REFERENCES faculty(id) ON DELETE CASCADE,
    timeslot_id  INTEGER     REFERENCES timeslots(id) ON DELETE CASCADE,
    is_preferred BOOLEAN     DEFAULT FALSE,
    PRIMARY KEY (faculty_id, timeslot_id)
);

-- 9. Course Assignments
CREATE TABLE course_assignments (
    id               VARCHAR(50)  PRIMARY KEY,
    section_id       VARCHAR(50)  REFERENCES sections(id) ON DELETE CASCADE,
    course_id        VARCHAR(50)  REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id       VARCHAR(50)  REFERENCES faculty(id) ON DELETE CASCADE,
    weekly_periods   INTEGER      NOT NULL,
    -- Optional: elective_group_id for cross-department elective assignments
    elective_group_id VARCHAR(50) DEFAULT NULL,
    -- Optional: lab_batch_id for batch-specific practical assignments (Step 2+)
    lab_batch_id     VARCHAR(50)  DEFAULT NULL
);

-- 10. Schedules (run history)
CREATE TABLE schedules (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active  BOOLEAN      DEFAULT FALSE,
    -- Optional: link a run to a semester for isolation
    semester_id VARCHAR(20) REFERENCES semesters(id) ON DELETE SET NULL
);

-- 11. Scheduled Classes (solver output)
CREATE TABLE scheduled_classes (
    id            SERIAL      PRIMARY KEY,
    schedule_id   UUID        REFERENCES schedules(id) ON DELETE CASCADE,
    assignment_id VARCHAR(50) REFERENCES course_assignments(id) ON DELETE CASCADE,
    lab_batch_id  VARCHAR(50) DEFAULT NULL,
    period_idx    INTEGER     NOT NULL,
    timeslot_id   INTEGER     REFERENCES timeslots(id) ON DELETE CASCADE,
    room_id       VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_scheduled_classes_unique ON scheduled_classes (schedule_id, assignment_id, COALESCE(lab_batch_id, 'NONE'), period_idx);

-- ============================================================================
-- LAYER 2 — BATCH AND STUDENT STRUCTURE
-- ============================================================================

-- 12. Lab Batches
--    One section (~84 students) is divided into 4 lab batches A, B, C, D.
--    Each batch has ~21 students.
--    DATA NOTE: Batch sizes are synthetic estimates from the project spec.
CREATE TABLE lab_batches (
    id            VARCHAR(50)  PRIMARY KEY,
    section_id    VARCHAR(50)  NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    batch_code    VARCHAR(5)   NOT NULL CHECK (batch_code IN ('A', 'B', 'C', 'D')),
    student_count INTEGER      NOT NULL,
    UNIQUE (section_id, batch_code)
);

-- 13. Students
--    DATA NOTE: Student records in seed data are SYNTHETIC placeholders.
--    Exact roll numbers and elective choices are NOT verified institutional data.
CREATE TABLE students (
    id           VARCHAR(50)  PRIMARY KEY,
    roll_number  VARCHAR(30)  NOT NULL UNIQUE,
    name         VARCHAR(100) NOT NULL,
    section_id   VARCHAR(50)  NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    semester_id  VARCHAR(20)  NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    lab_batch_id VARCHAR(50)  REFERENCES lab_batches(id) ON DELETE SET NULL,
    -- Integrity: lab_batch must belong to the student's section
    -- (enforced by application layer and seed data)
    CONSTRAINT fk_student_section_coherence
        CHECK (section_id IS NOT NULL AND semester_id IS NOT NULL)
);

-- 14. Elective Groups
--    Cross-department students elect a common course.
--    A course may be split into multiple groups if total enrollment exceeds
--    room capacity. Each group gets its own schedule slot and room.
--    DATA NOTE: Group composition is SYNTHETIC for the MVP seed.
CREATE TABLE elective_groups (
    id             VARCHAR(50)  PRIMARY KEY,
    semester_id    VARCHAR(20)  NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    course_id      VARCHAR(50)  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,   -- e.g. "Cyber Security - Group 1"
    capacity       INTEGER      NOT NULL,
    enrolled_count INTEGER      NOT NULL DEFAULT 0
);

-- 15. Student Elective Selections
--    Maps which students chose which elective group.
CREATE TABLE student_elective_selections (
    student_id       VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    elective_group_id VARCHAR(50) NOT NULL REFERENCES elective_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, elective_group_id)
);

-- ============================================================================
-- INDEXES for common query patterns
-- ============================================================================

CREATE INDEX idx_sections_semester    ON sections (semester_id);
CREATE INDEX idx_sections_department  ON sections (department_id);
CREATE INDEX idx_lab_batches_section  ON lab_batches (section_id);
CREATE INDEX idx_students_section     ON students (section_id);
CREATE INDEX idx_students_semester    ON students (semester_id);
CREATE INDEX idx_students_batch       ON students (lab_batch_id);
CREATE INDEX idx_courses_semester     ON courses (semester_id);
CREATE INDEX idx_ca_section           ON course_assignments (section_id);
CREATE INDEX idx_ca_course            ON course_assignments (course_id);
CREATE INDEX idx_ca_faculty           ON course_assignments (faculty_id);
CREATE INDEX idx_eg_semester          ON elective_groups (semester_id);
CREATE INDEX idx_schedules_semester   ON schedules (semester_id);
CREATE INDEX idx_schedules_active     ON schedules (is_active);
A L T E R   T A B L E   s c h e d u l e d _ c l a s s e s   A D D   C O N S T R A I N T   f k _ s c _ l a b _ b a t c h   F O R E I G N   K E Y   ( l a b _ b a t c h _ i d )   R E F E R E N C E S   l a b _ b a t c h e s ( i d )   O N   D E L E T E   C A S C A D E ;  
 