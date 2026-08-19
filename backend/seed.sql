-- ============================================================================
-- CredWeave AI Timetable Generator — Seed Data
-- SIH-25091 / CHA-229 — NEP 2020
-- ============================================================================
--
-- DATA CLASSIFICATION: SYNTHETIC / DEMO
--   All data below is SYNTHETIC and DEMO data based on the institutional
--   specification documented in the project. It is NOT live institutional data.
--   Specific items that are VERIFIED from the project specification are
--   annotated with [VERIFIED]. Items that are SYNTHETIC are annotated [SYNTH].
--   Items that are INFERRED are annotated [INFERRED].
--
-- STRUCTURE:
--   Section A  — Semesters (1 through 5)
--   Section B  — Departments (CE, CSE, IT)                 [VERIFIED]
--   Section C  — Timeslots (Institutional daily blocks)    [VERIFIED structure]
--   Section D  — Rooms (Institutional inventory)           [VERIFIED structure]
--   Section E  — Semester 5: Full demo curriculum
--   Section F  — Semesters 1-4: Minimal stub data
--   Section G  — Original sandbox solver test data (preserved)
-- ============================================================================


-- ============================================================================
-- SECTION A — SEMESTERS
-- academic_year "2026-27" is [INFERRED] for the current academic context.
-- semester_number values are [VERIFIED] from the project specification.
-- ============================================================================

INSERT INTO semesters (id, semester_number, name, academic_year, is_active) VALUES
('SEM1', 1, 'Semester 1', '2026-27', FALSE),
('SEM2', 2, 'Semester 2', '2026-27', FALSE),
('SEM3', 3, 'Semester 3', '2026-27', FALSE),
('SEM4', 4, 'Semester 4', '2026-27', FALSE),
('SEM5', 5, 'Semester 5', '2026-27', TRUE);   -- Primary demo semester


-- ============================================================================
-- SECTION B — DEPARTMENTS
-- [VERIFIED] from project specification: CE, CSE, IT
-- Full names are [INFERRED] standard engineering department names.
-- ============================================================================

INSERT INTO departments (id, code, name) VALUES
('DEPT_CE',  'CE',  'Computer Engineering'),
('DEPT_CSE', 'CSE', 'Computer Science and Engineering'),
('DEPT_IT',  'IT',  'Information Technology');


-- ============================================================================
-- SECTION C — TIMESLOTS
-- [VERIFIED] Daily academic structure from project specification:
--   09:10–11:10  Teaching Block 1  (2-hour block → 2 one-hour slots)
--   11:10–12:10  Lunch break       (not scheduled)
--   12:10–14:10  Teaching Block 2  (2-hour block → 2 one-hour slots)
--   14:10–14:20  Short break       (not scheduled)
--   14:20–16:20  Teaching Block 3  (2-hour block → 2 one-hour slots)
--
-- Representation: 5 working days × 6 schedulable 1-hour slots = 30 timeslots.
-- Slot IDs are assigned as: day_index * 6 + slot_within_day (0-indexed).
-- This layout correctly maps 2-hour continuous blocks:
--   Block 1: slots 0+1 (09:10 + 10:10)
--   Block 2: slots 2+3 (12:10 + 13:10)
--   Block 3: slots 4+5 (14:20 + 15:20)
--
-- NOTE: The solver currently treats these as discrete 1-hour periods.
--       2-hour continuous block enforcement is a Step 2 implementation task.
-- ============================================================================

INSERT INTO timeslots (id, day, time) VALUES
-- Monday (day 0, IDs 0-5)
(0,  'Monday',    '09:10'),
(1,  'Monday',    '10:10'),
(2,  'Monday',    '12:10'),
(3,  'Monday',    '13:10'),
(4,  'Monday',    '14:20'),
(5,  'Monday',    '15:20'),
-- Tuesday (day 1, IDs 6-11)
(6,  'Tuesday',   '09:10'),
(7,  'Tuesday',   '10:10'),
(8,  'Tuesday',   '12:10'),
(9,  'Tuesday',   '13:10'),
(10, 'Tuesday',   '14:20'),
(11, 'Tuesday',   '15:20'),
-- Wednesday (day 2, IDs 12-17)
(12, 'Wednesday', '09:10'),
(13, 'Wednesday', '10:10'),
(14, 'Wednesday', '12:10'),
(15, 'Wednesday', '13:10'),
(16, 'Wednesday', '14:20'),
(17, 'Wednesday', '15:20'),
-- Thursday (day 3, IDs 18-23)
(18, 'Thursday',  '09:10'),
(19, 'Thursday',  '10:10'),
(20, 'Thursday',  '12:10'),
(21, 'Thursday',  '13:10'),
(22, 'Thursday',  '14:20'),
(23, 'Thursday',  '15:20'),
-- Friday (day 4, IDs 24-29)
(24, 'Friday',    '09:10'),
(25, 'Friday',    '10:10'),
(26, 'Friday',    '12:10'),
(27, 'Friday',    '13:10'),
(28, 'Friday',    '14:20'),
(29, 'Friday',    '15:20');


-- ============================================================================
-- SECTION D — ROOMS
-- [VERIFIED] Room inventory from project specification:
--   Lecture rooms: Ground 123-126, First 223-226, Third 323-326
--   Regular labs:  Ground 104-107, First 204-207, Third 304-307
--   Larger labs:   216, 218, 316, 318
--   Large halls:   229 (~100 students), 329 (~200 students)
--
-- Capacities: Lecture rooms [VERIFIED] ~85 students (one full section).
--             Labs [VERIFIED] ~21-25 students (one lab batch).
--             Large labs [INFERRED] ~50 students.
--             Halls [VERIFIED]: 229~100, 329~200.
-- ============================================================================

INSERT INTO rooms (id, name, capacity, is_lab, room_type) VALUES
-- Lecture rooms — Ground Floor
('R123', 'Room 123 (Ground)', 85, FALSE, 'lecture'),
('R124', 'Room 124 (Ground)', 85, FALSE, 'lecture'),
('R125', 'Room 125 (Ground)', 85, FALSE, 'lecture'),
('R126', 'Room 126 (Ground)', 85, FALSE, 'lecture'),
-- Lecture rooms — First Floor
('R223', 'Room 223 (First)',  85, FALSE, 'lecture'),
('R224', 'Room 224 (First)',  85, FALSE, 'lecture'),
('R225', 'Room 225 (First)',  85, FALSE, 'lecture'),
('R226', 'Room 226 (First)',  85, FALSE, 'lecture'),
-- Lecture rooms — Third Floor
('R323', 'Room 323 (Third)', 85, FALSE, 'lecture'),
('R324', 'Room 324 (Third)', 85, FALSE, 'lecture'),
('R325', 'Room 325 (Third)', 85, FALSE, 'lecture'),
('R326', 'Room 326 (Third)', 85, FALSE, 'lecture'),
-- Regular labs — Ground Floor (capacity 25 per batch)
('L104', 'Lab 104 (Ground)', 25, TRUE, 'lab'),
('L105', 'Lab 105 (Ground)', 25, TRUE, 'lab'),
('L106', 'Lab 106 (Ground)', 25, TRUE, 'lab'),
('L107', 'Lab 107 (Ground)', 25, TRUE, 'lab'),
-- Regular labs — First Floor
('L204', 'Lab 204 (First)',  25, TRUE, 'lab'),
('L205', 'Lab 205 (First)',  25, TRUE, 'lab'),
('L206', 'Lab 206 (First)',  25, TRUE, 'lab'),
('L207', 'Lab 207 (First)',  25, TRUE, 'lab'),
-- Regular labs — Third Floor
('L304', 'Lab 304 (Third)', 25, TRUE, 'lab'),
('L305', 'Lab 305 (Third)', 25, TRUE, 'lab'),
('L306', 'Lab 306 (Third)', 25, TRUE, 'lab'),
('L307', 'Lab 307 (Third)', 25, TRUE, 'lab'),
-- Larger labs (for merged practical groups)
('L216', 'Lab 216 (Large)', 50, TRUE, 'lab'),
('L218', 'Lab 218 (Large)', 50, TRUE, 'lab'),
('L316', 'Lab 316 (Large)', 50, TRUE, 'lab'),
('L318', 'Lab 318 (Large)', 50, TRUE, 'lab'),
-- Large halls (for cross-department electives and plenary sessions)
('H229', 'Hall 229',        100, FALSE, 'hall'),
('H329', 'Hall 329',        200, FALSE, 'hall');


-- ============================================================================
-- SECTION E — SEMESTER 5: FULL DEMO DATASET
-- This is the primary demonstration semester.
-- All data below is SYNTHETIC based on the project specification.
-- ============================================================================

-- ─── E.1 Sections (Semester 5) ─────────────────────────────────────────────
-- [VERIFIED] Section names: CE1, CE2, CSE1, CSE2, IT1, IT2
-- [VERIFIED] Approximate section size: 80-85 students (using 84 for determinism)
-- Total: 6 sections × 84 = 504 students [VERIFIED target: 504]

INSERT INTO sections (id, name, student_count, semester_id, department_id, section_code) VALUES
('S5_CE1',  'CE1',  84, 'SEM5', 'DEPT_CE',  'CE1'),
('S5_CE2',  'CE2',  84, 'SEM5', 'DEPT_CE',  'CE2'),
('S5_CSE1', 'CSE1', 84, 'SEM5', 'DEPT_CSE', 'CSE1'),
('S5_CSE2', 'CSE2', 84, 'SEM5', 'DEPT_CSE', 'CSE2'),
('S5_IT1',  'IT1',  84, 'SEM5', 'DEPT_IT',  'IT1'),
('S5_IT2',  'IT2',  84, 'SEM5', 'DEPT_IT',  'IT2');


-- ─── E.2 Lab Batches (Semester 5) ──────────────────────────────────────────
-- [VERIFIED] 4 batches (A, B, C, D) per section, 24 total lab batches.
-- [VERIFIED] Approximately 21 students per batch (84 / 4 = 21 exactly).
-- Total: 24 lab batches × 21 = 504 students (matches section total)

INSERT INTO lab_batches (id, section_id, batch_code, student_count) VALUES
-- CE1 batches
('LB_CE1_A', 'S5_CE1', 'A', 21),
('LB_CE1_B', 'S5_CE1', 'B', 21),
('LB_CE1_C', 'S5_CE1', 'C', 21),
('LB_CE1_D', 'S5_CE1', 'D', 21),
-- CE2 batches
('LB_CE2_A', 'S5_CE2', 'A', 21),
('LB_CE2_B', 'S5_CE2', 'B', 21),
('LB_CE2_C', 'S5_CE2', 'C', 21),
('LB_CE2_D', 'S5_CE2', 'D', 21),
-- CSE1 batches
('LB_CSE1_A', 'S5_CSE1', 'A', 21),
('LB_CSE1_B', 'S5_CSE1', 'B', 21),
('LB_CSE1_C', 'S5_CSE1', 'C', 21),
('LB_CSE1_D', 'S5_CSE1', 'D', 21),
-- CSE2 batches
('LB_CSE2_A', 'S5_CSE2', 'A', 21),
('LB_CSE2_B', 'S5_CSE2', 'B', 21),
('LB_CSE2_C', 'S5_CSE2', 'C', 21),
('LB_CSE2_D', 'S5_CSE2', 'D', 21),
-- IT1 batches
('LB_IT1_A', 'S5_IT1', 'A', 21),
('LB_IT1_B', 'S5_IT1', 'B', 21),
('LB_IT1_C', 'S5_IT1', 'C', 21),
('LB_IT1_D', 'S5_IT1', 'D', 21),
-- IT2 batches
('LB_IT2_A', 'S5_IT2', 'A', 21),
('LB_IT2_B', 'S5_IT2', 'B', 21),
('LB_IT2_C', 'S5_IT2', 'C', 21),
('LB_IT2_D', 'S5_IT2', 'D', 21);


-- ─── E.3 Faculty (Semester 5 — [SYNTH] placeholder names) ─────────────────
-- Faculty list is SYNTHETIC. Real faculty expertise mapping is MISSING data.
-- Department assignment is INFERRED from course domain.
-- Availability: All faculty available for all 30 timeslots by default.
-- (In production: replace with real faculty data.)

INSERT INTO faculty (id, name, department_id) VALUES
-- CE Department faculty
('F_CE_01', 'Prof. A. Sharma (CE)',      'DEPT_CE'),
('F_CE_02', 'Prof. B. Patel (CE)',       'DEPT_CE'),
('F_CE_03', 'Prof. C. Mehta (CE)',       'DEPT_CE'),
('F_CE_04', 'Prof. D. Joshi (CE)',       'DEPT_CE'),
('F_CE_05', 'Prof. E. Trivedi (CE)',     'DEPT_CE'),
-- CSE Department faculty
('F_CSE_01', 'Prof. F. Kumar (CSE)',     'DEPT_CSE'),
('F_CSE_02', 'Prof. G. Singh (CSE)',     'DEPT_CSE'),
('F_CSE_03', 'Prof. H. Verma (CSE)',     'DEPT_CSE'),
('F_CSE_04', 'Prof. I. Gupta (CSE)',     'DEPT_CSE'),
('F_CSE_05', 'Prof. J. Yadav (CSE)',     'DEPT_CSE'),
-- IT Department faculty
('F_IT_01',  'Prof. K. Shah (IT)',       'DEPT_IT'),
('F_IT_02',  'Prof. L. Dave (IT)',       'DEPT_IT'),
('F_IT_03',  'Prof. M. Pandya (IT)',     'DEPT_IT'),
('F_IT_04',  'Prof. N. Raval (IT)',      'DEPT_IT'),
('F_IT_05',  'Prof. O. Desai (IT)',      'DEPT_IT');

-- Faculty Availability for Sem 5 faculty: All 30 timeslots available by default.
-- (is_preferred = FALSE for all; soft preferences are MISSING institutional data.)
INSERT INTO faculty_availability (faculty_id, timeslot_id, is_preferred)
SELECT f.id, t.id, FALSE
FROM faculty f
CROSS JOIN timeslots t
WHERE f.id LIKE 'F_%';


-- ─── E.4 Courses (Semester 5) ──────────────────────────────────────────────
-- [SYNTH] Placeholder NEP 2020-style Semester 5 curriculum.
-- Course codes, names, credits, and contact hours are SYNTHETIC.
-- Real institutional curriculum for every semester is MISSING data.
-- Elective courses are shared across CE, CSE, IT (no fixed department_id).

-- CE Department — Semester 5 Theory Courses
INSERT INTO courses (id, name, requires_lab, course_code, credits, course_type, weekly_hours, semester_id, department_id, is_elective) VALUES
('C5_CE_OS',    'Operating Systems',            FALSE, 'CE501',  4, 'theory',     3, 'SEM5', 'DEPT_CE', FALSE),
('C5_CE_CN',    'Computer Networks',            FALSE, 'CE502',  4, 'theory',     3, 'SEM5', 'DEPT_CE', FALSE),
('C5_CE_SE',    'Software Engineering',         FALSE, 'CE503',  3, 'theory',     3, 'SEM5', 'DEPT_CE', FALSE),
('C5_CE_ML',    'Machine Learning',             FALSE, 'CE504',  4, 'theory',     3, 'SEM5', 'DEPT_CE', FALSE),
('C5_CE_OS_P',  'Operating Systems Lab',        TRUE,  'CE591',  1, 'practical',  2, 'SEM5', 'DEPT_CE', FALSE),
('C5_CE_CN_P',  'Computer Networks Lab',        TRUE,  'CE592',  1, 'practical',  2, 'SEM5', 'DEPT_CE', FALSE);

-- CSE Department — Semester 5 Theory Courses
INSERT INTO courses (id, name, requires_lab, course_code, credits, course_type, weekly_hours, semester_id, department_id, is_elective) VALUES
('C5_CSE_AI',   'Artificial Intelligence',      FALSE, 'CSE501', 4, 'theory',     3, 'SEM5', 'DEPT_CSE', FALSE),
('C5_CSE_DB',   'Database Management Systems',  FALSE, 'CSE502', 4, 'theory',     3, 'SEM5', 'DEPT_CSE', FALSE),
('C5_CSE_CD',   'Compiler Design',              FALSE, 'CSE503', 3, 'theory',     3, 'SEM5', 'DEPT_CSE', FALSE),
('C5_CSE_CC',   'Cloud Computing',              FALSE, 'CSE504', 3, 'theory',     3, 'SEM5', 'DEPT_CSE', FALSE),
('C5_CSE_AI_P', 'AI and ML Lab',                TRUE,  'CSE591', 1, 'practical',  2, 'SEM5', 'DEPT_CSE', FALSE),
('C5_CSE_DB_P', 'DBMS Lab',                     TRUE,  'CSE592', 1, 'practical',  2, 'SEM5', 'DEPT_CSE', FALSE);

-- IT Department — Semester 5 Theory Courses
INSERT INTO courses (id, name, requires_lab, course_code, credits, course_type, weekly_hours, semester_id, department_id, is_elective) VALUES
('C5_IT_IS',    'Information Security',         FALSE, 'IT501',  4, 'theory',     3, 'SEM5', 'DEPT_IT', FALSE),
('C5_IT_WD',    'Web Development',              FALSE, 'IT502',  4, 'theory',     3, 'SEM5', 'DEPT_IT', FALSE),
('C5_IT_IOT',   'Internet of Things',           FALSE, 'IT503',  3, 'theory',     3, 'SEM5', 'DEPT_IT', FALSE),
('C5_IT_MN',    'Mobile Networks',              FALSE, 'IT504',  3, 'theory',     3, 'SEM5', 'DEPT_IT', FALSE),
('C5_IT_WD_P',  'Web Development Lab',          TRUE,  'IT591',  1, 'practical',  2, 'SEM5', 'DEPT_IT', FALSE),
('C5_IT_IOT_P', 'IoT Lab',                      TRUE,  'IT592',  1, 'practical',  2, 'SEM5', 'DEPT_IT', FALSE);

-- Cross-Department NEP Electives (Semester 5)
-- Students from CE, CSE, IT may enrol in these. No fixed department_id.
INSERT INTO courses (id, name, requires_lab, course_code, credits, course_type, weekly_hours, semester_id, department_id, is_elective) VALUES
('C5_ELEC_CS',  'Cyber Security',               FALSE, 'ELEC501', 3, 'theory',    3, 'SEM5', NULL, TRUE),
('C5_ELEC_BDA', 'Big Data Analytics',           FALSE, 'ELEC502', 3, 'theory',    3, 'SEM5', NULL, TRUE),
('C5_ELEC_BC',  'Blockchain Technology',        FALSE, 'ELEC503', 3, 'theory',    3, 'SEM5', NULL, TRUE);


-- ─── E.5 Elective Groups (Semester 5) ──────────────────────────────────────
-- [SYNTH] Elective group enrollment distribution is SYNTHETIC.
-- NEP 2020 Cross-Department Elective Baskets:
-- Students from CE, CSE, and IT choose one course option from the elective basket.
-- Courses sharing the same elective_group_id are synchronized to the exact same timeslot
-- while using independent rooms and faculty across departments.

INSERT INTO elective_groups (id, semester_id, course_id, name, capacity, enrolled_count) VALUES
-- Elective Basket 1 — Track A (Cyber Security, Big Data, Blockchain)
('EG5_ELEC_GRP1', 'SEM5', 'C5_ELEC_CS',  'NEP Elective Basket 1 — Track A', 150, 150),
-- Elective Basket 1 — Track B (Cyber Security, Big Data, Blockchain)
('EG5_ELEC_GRP2', 'SEM5', 'C5_ELEC_CS',  'NEP Elective Basket 1 — Track B', 150, 150);


-- ─── E.6 Course Assignments (Semester 5) ───────────────────────────────────
-- Links sections to courses with assigned faculty and weekly periods.
-- [SYNTH] Faculty-course expertise mapping is SYNTHETIC.
-- weekly_periods matches course weekly_hours (theory=3, practical=2 per week).
--
-- Naming convention: CA5_{SECTION}_{COURSE_SHORT}
-- where section code and course code identify the assignment uniquely.

-- CE1 Theory courses
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('CA5_CE1_OS',   'S5_CE1', 'C5_CE_OS',   'F_CE_01', 3),
('CA5_CE1_CN',   'S5_CE1', 'C5_CE_CN',   'F_CE_02', 3),
('CA5_CE1_SE',   'S5_CE1', 'C5_CE_SE',   'F_CE_03', 3),
('CA5_CE1_ML',   'S5_CE1', 'C5_CE_ML',   'F_CE_04', 3),
('CA5_CE1_OS_P', 'S5_CE1', 'C5_CE_OS_P', 'F_CE_01', 2),
('CA5_CE1_CN_P', 'S5_CE1', 'C5_CE_CN_P', 'F_CE_02', 2);

-- CE2 Theory courses
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('CA5_CE2_OS',   'S5_CE2', 'C5_CE_OS',   'F_CE_05', 3),
('CA5_CE2_CN',   'S5_CE2', 'C5_CE_CN',   'F_CE_01', 3),
('CA5_CE2_SE',   'S5_CE2', 'C5_CE_SE',   'F_CE_02', 3),
('CA5_CE2_ML',   'S5_CE2', 'C5_CE_ML',   'F_CE_03', 3),
('CA5_CE2_OS_P', 'S5_CE2', 'C5_CE_OS_P', 'F_CE_05', 2),
('CA5_CE2_CN_P', 'S5_CE2', 'C5_CE_CN_P', 'F_CE_04', 2);

-- CSE1 Theory courses
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('CA5_CSE1_AI',   'S5_CSE1', 'C5_CSE_AI',   'F_CSE_01', 3),
('CA5_CSE1_DB',   'S5_CSE1', 'C5_CSE_DB',   'F_CSE_02', 3),
('CA5_CSE1_CD',   'S5_CSE1', 'C5_CSE_CD',   'F_CSE_03', 3),
('CA5_CSE1_CC',   'S5_CSE1', 'C5_CSE_CC',   'F_CSE_04', 3),
('CA5_CSE1_AI_P', 'S5_CSE1', 'C5_CSE_AI_P', 'F_CSE_01', 2),
('CA5_CSE1_DB_P', 'S5_CSE1', 'C5_CSE_DB_P', 'F_CSE_02', 2);

-- CSE2 Theory courses
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('CA5_CSE2_AI',   'S5_CSE2', 'C5_CSE_AI',   'F_CSE_05', 3),
('CA5_CSE2_DB',   'S5_CSE2', 'C5_CSE_DB',   'F_CSE_01', 3),
('CA5_CSE2_CD',   'S5_CSE2', 'C5_CSE_CD',   'F_CSE_02', 3),
('CA5_CSE2_CC',   'S5_CSE2', 'C5_CSE_CC',   'F_CSE_03', 3),
('CA5_CSE2_AI_P', 'S5_CSE2', 'C5_CSE_AI_P', 'F_CSE_05', 2),
('CA5_CSE2_DB_P', 'S5_CSE2', 'C5_CSE_DB_P', 'F_CSE_04', 2);

-- IT1 Theory courses
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('CA5_IT1_IS',    'S5_IT1', 'C5_IT_IS',    'F_IT_01', 3),
('CA5_IT1_WD',    'S5_IT1', 'C5_IT_WD',    'F_IT_02', 3),
('CA5_IT1_IOT',   'S5_IT1', 'C5_IT_IOT',   'F_IT_03', 3),
('CA5_IT1_MN',    'S5_IT1', 'C5_IT_MN',    'F_IT_04', 3),
('CA5_IT1_WD_P',  'S5_IT1', 'C5_IT_WD_P',  'F_IT_02', 2),
('CA5_IT1_IOT_P', 'S5_IT1', 'C5_IT_IOT_P', 'F_IT_03', 2);

-- IT2 Theory courses
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('CA5_IT2_IS',    'S5_IT2', 'C5_IT_IS',    'F_IT_05', 3),
('CA5_IT2_WD',    'S5_IT2', 'C5_IT_WD',    'F_IT_01', 3),
('CA5_IT2_IOT',   'S5_IT2', 'C5_IT_IOT',   'F_IT_04', 3),
('CA5_IT2_MN',    'S5_IT2', 'C5_IT_MN',    'F_IT_05', 3),
('CA5_IT2_WD_P',  'S5_IT2', 'C5_IT_WD_P',  'F_IT_01', 2),
('CA5_IT2_IOT_P', 'S5_IT2', 'C5_IT_IOT_P', 'F_IT_04', 2);

-- Cross-Department Elective Group Course Assignments
-- Group 1 (Track A): Cyber Security, Big Data, Blockchain synchronized across CE, CSE, IT
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods, elective_group_id) VALUES
('CA5_EG_CS_G1',  'S5_CE1',  'C5_ELEC_CS',  'F_CSE_05', 3, 'EG5_ELEC_GRP1'),
('CA5_EG_BDA_G1', 'S5_CE2',  'C5_ELEC_BDA', 'F_CSE_04', 3, 'EG5_ELEC_GRP1'),
('CA5_EG_BC_G1',  'S5_IT1',  'C5_ELEC_BC',  'F_IT_05',  3, 'EG5_ELEC_GRP1'),
-- Group 2 (Track B): Cyber Security, Big Data, Blockchain synchronized across CE, CSE, IT
('CA5_EG_CS_G2',  'S5_CSE1', 'C5_ELEC_CS',  'F_CSE_03', 3, 'EG5_ELEC_GRP2'),
('CA5_EG_BDA_G2', 'S5_CSE2', 'C5_ELEC_BDA', 'F_CSE_02', 3, 'EG5_ELEC_GRP2'),
('CA5_EG_BC_G2',  'S5_IT2',  'C5_ELEC_BC',  'F_IT_04',  3, 'EG5_ELEC_GRP2');



-- ─── E.7 Students (Semester 5 — SYNTHETIC PLACEHOLDERS) ───────────────────
-- [SYNTH] All student records below are SYNTHETIC PLACEHOLDER entries.
-- Exact student roll numbers are NOT verified institutional data.
-- Generating 10 synthetic students per section (60 total) as representative
-- placeholders. A full production seed would load from institutional records.
--
-- Roll number format: [DEPT][SEM5][SECTION][SEQ]
-- Lab batch assignment: students 1-21 → A, 22-42 → B, 43-63 → C, 64-84 → D
-- (Only first 10 per section seeded for MVP demo.)

-- CE1 (10 representative students, batches A)
INSERT INTO students (id, roll_number, name, section_id, semester_id, lab_batch_id) VALUES
('STU_CE1_001', '22CE1001', 'Demo Student CE1-001', 'S5_CE1', 'SEM5', 'LB_CE1_A'),
('STU_CE1_002', '22CE1002', 'Demo Student CE1-002', 'S5_CE1', 'SEM5', 'LB_CE1_A'),
('STU_CE1_003', '22CE1003', 'Demo Student CE1-003', 'S5_CE1', 'SEM5', 'LB_CE1_A'),
('STU_CE1_004', '22CE1004', 'Demo Student CE1-004', 'S5_CE1', 'SEM5', 'LB_CE1_A'),
('STU_CE1_005', '22CE1005', 'Demo Student CE1-005', 'S5_CE1', 'SEM5', 'LB_CE1_B'),
('STU_CE1_006', '22CE1006', 'Demo Student CE1-006', 'S5_CE1', 'SEM5', 'LB_CE1_B'),
('STU_CE1_007', '22CE1007', 'Demo Student CE1-007', 'S5_CE1', 'SEM5', 'LB_CE1_C'),
('STU_CE1_008', '22CE1008', 'Demo Student CE1-008', 'S5_CE1', 'SEM5', 'LB_CE1_C'),
('STU_CE1_009', '22CE1009', 'Demo Student CE1-009', 'S5_CE1', 'SEM5', 'LB_CE1_D'),
('STU_CE1_010', '22CE1010', 'Demo Student CE1-010', 'S5_CE1', 'SEM5', 'LB_CE1_D');

-- CE2 (10 representative students)
INSERT INTO students (id, roll_number, name, section_id, semester_id, lab_batch_id) VALUES
('STU_CE2_001', '22CE2001', 'Demo Student CE2-001', 'S5_CE2', 'SEM5', 'LB_CE2_A'),
('STU_CE2_002', '22CE2002', 'Demo Student CE2-002', 'S5_CE2', 'SEM5', 'LB_CE2_A'),
('STU_CE2_003', '22CE2003', 'Demo Student CE2-003', 'S5_CE2', 'SEM5', 'LB_CE2_A'),
('STU_CE2_004', '22CE2004', 'Demo Student CE2-004', 'S5_CE2', 'SEM5', 'LB_CE2_B'),
('STU_CE2_005', '22CE2005', 'Demo Student CE2-005', 'S5_CE2', 'SEM5', 'LB_CE2_B'),
('STU_CE2_006', '22CE2006', 'Demo Student CE2-006', 'S5_CE2', 'SEM5', 'LB_CE2_C'),
('STU_CE2_007', '22CE2007', 'Demo Student CE2-007', 'S5_CE2', 'SEM5', 'LB_CE2_C'),
('STU_CE2_008', '22CE2008', 'Demo Student CE2-008', 'S5_CE2', 'SEM5', 'LB_CE2_D'),
('STU_CE2_009', '22CE2009', 'Demo Student CE2-009', 'S5_CE2', 'SEM5', 'LB_CE2_D'),
('STU_CE2_010', '22CE2010', 'Demo Student CE2-010', 'S5_CE2', 'SEM5', 'LB_CE2_D');

-- CSE1 (10 representative students)
INSERT INTO students (id, roll_number, name, section_id, semester_id, lab_batch_id) VALUES
('STU_CSE1_001', '22CSE1001', 'Demo Student CSE1-001', 'S5_CSE1', 'SEM5', 'LB_CSE1_A'),
('STU_CSE1_002', '22CSE1002', 'Demo Student CSE1-002', 'S5_CSE1', 'SEM5', 'LB_CSE1_A'),
('STU_CSE1_003', '22CSE1003', 'Demo Student CSE1-003', 'S5_CSE1', 'SEM5', 'LB_CSE1_A'),
('STU_CSE1_004', '22CSE1004', 'Demo Student CSE1-004', 'S5_CSE1', 'SEM5', 'LB_CSE1_B'),
('STU_CSE1_005', '22CSE1005', 'Demo Student CSE1-005', 'S5_CSE1', 'SEM5', 'LB_CSE1_B'),
('STU_CSE1_006', '22CSE1006', 'Demo Student CSE1-006', 'S5_CSE1', 'SEM5', 'LB_CSE1_C'),
('STU_CSE1_007', '22CSE1007', 'Demo Student CSE1-007', 'S5_CSE1', 'SEM5', 'LB_CSE1_C'),
('STU_CSE1_008', '22CSE1008', 'Demo Student CSE1-008', 'S5_CSE1', 'SEM5', 'LB_CSE1_D'),
('STU_CSE1_009', '22CSE1009', 'Demo Student CSE1-009', 'S5_CSE1', 'SEM5', 'LB_CSE1_D'),
('STU_CSE1_010', '22CSE1010', 'Demo Student CSE1-010', 'S5_CSE1', 'SEM5', 'LB_CSE1_D');

-- CSE2 (10 representative students)
INSERT INTO students (id, roll_number, name, section_id, semester_id, lab_batch_id) VALUES
('STU_CSE2_001', '22CSE2001', 'Demo Student CSE2-001', 'S5_CSE2', 'SEM5', 'LB_CSE2_A'),
('STU_CSE2_002', '22CSE2002', 'Demo Student CSE2-002', 'S5_CSE2', 'SEM5', 'LB_CSE2_A'),
('STU_CSE2_003', '22CSE2003', 'Demo Student CSE2-003', 'S5_CSE2', 'SEM5', 'LB_CSE2_A'),
('STU_CSE2_004', '22CSE2004', 'Demo Student CSE2-004', 'S5_CSE2', 'SEM5', 'LB_CSE2_B'),
('STU_CSE2_005', '22CSE2005', 'Demo Student CSE2-005', 'S5_CSE2', 'SEM5', 'LB_CSE2_B'),
('STU_CSE2_006', '22CSE2006', 'Demo Student CSE2-006', 'S5_CSE2', 'SEM5', 'LB_CSE2_C'),
('STU_CSE2_007', '22CSE2007', 'Demo Student CSE2-007', 'S5_CSE2', 'SEM5', 'LB_CSE2_C'),
('STU_CSE2_008', '22CSE2008', 'Demo Student CSE2-008', 'S5_CSE2', 'SEM5', 'LB_CSE2_D'),
('STU_CSE2_009', '22CSE2009', 'Demo Student CSE2-009', 'S5_CSE2', 'SEM5', 'LB_CSE2_D'),
('STU_CSE2_010', '22CSE2010', 'Demo Student CSE2-010', 'S5_CSE2', 'SEM5', 'LB_CSE2_D');

-- IT1 (10 representative students)
INSERT INTO students (id, roll_number, name, section_id, semester_id, lab_batch_id) VALUES
('STU_IT1_001', '22IT1001', 'Demo Student IT1-001', 'S5_IT1', 'SEM5', 'LB_IT1_A'),
('STU_IT1_002', '22IT1002', 'Demo Student IT1-002', 'S5_IT1', 'SEM5', 'LB_IT1_A'),
('STU_IT1_003', '22IT1003', 'Demo Student IT1-003', 'S5_IT1', 'SEM5', 'LB_IT1_A'),
('STU_IT1_004', '22IT1004', 'Demo Student IT1-004', 'S5_IT1', 'SEM5', 'LB_IT1_B'),
('STU_IT1_005', '22IT1005', 'Demo Student IT1-005', 'S5_IT1', 'SEM5', 'LB_IT1_B'),
('STU_IT1_006', '22IT1006', 'Demo Student IT1-006', 'S5_IT1', 'SEM5', 'LB_IT1_C'),
('STU_IT1_007', '22IT1007', 'Demo Student IT1-007', 'S5_IT1', 'SEM5', 'LB_IT1_C'),
('STU_IT1_008', '22IT1008', 'Demo Student IT1-008', 'S5_IT1', 'SEM5', 'LB_IT1_D'),
('STU_IT1_009', '22IT1009', 'Demo Student IT1-009', 'S5_IT1', 'SEM5', 'LB_IT1_D'),
('STU_IT1_010', '22IT1010', 'Demo Student IT1-010', 'S5_IT1', 'SEM5', 'LB_IT1_D');

-- IT2 (10 representative students)
INSERT INTO students (id, roll_number, name, section_id, semester_id, lab_batch_id) VALUES
('STU_IT2_001', '22IT2001', 'Demo Student IT2-001', 'S5_IT2', 'SEM5', 'LB_IT2_A'),
('STU_IT2_002', '22IT2002', 'Demo Student IT2-002', 'S5_IT2', 'SEM5', 'LB_IT2_A'),
('STU_IT2_003', '22IT2003', 'Demo Student IT2-003', 'S5_IT2', 'SEM5', 'LB_IT2_A'),
('STU_IT2_004', '22IT2004', 'Demo Student IT2-004', 'S5_IT2', 'SEM5', 'LB_IT2_B'),
('STU_IT2_005', '22IT2005', 'Demo Student IT2-005', 'S5_IT2', 'SEM5', 'LB_IT2_B'),
('STU_IT2_006', '22IT2006', 'Demo Student IT2-006', 'S5_IT2', 'SEM5', 'LB_IT2_C'),
('STU_IT2_007', '22IT2007', 'Demo Student IT2-007', 'S5_IT2', 'SEM5', 'LB_IT2_C'),
('STU_IT2_008', '22IT2008', 'Demo Student IT2-008', 'S5_IT2', 'SEM5', 'LB_IT2_D'),
('STU_IT2_009', '22IT2009', 'Demo Student IT2-009', 'S5_IT2', 'SEM5', 'LB_IT2_D'),
('STU_IT2_010', '22IT2010', 'Demo Student IT2-010', 'S5_IT2', 'SEM5', 'LB_IT2_D');

-- ─── E.8 Student Elective Selections (Semester 5 — SYNTHETIC) ──────────────
-- Sample: Students assigned to Track A (Group 1) and Track B (Group 2)
-- [SYNTH] Real elective enrollment distribution is MISSING data.
INSERT INTO student_elective_selections (student_id, elective_group_id) VALUES
('STU_CE1_001', 'EG5_ELEC_GRP1'),
('STU_CE1_002', 'EG5_ELEC_GRP1'),
('STU_CSE1_001','EG5_ELEC_GRP1'),
('STU_CSE1_002','EG5_ELEC_GRP1'),
('STU_IT1_001', 'EG5_ELEC_GRP1'),
('STU_IT1_002', 'EG5_ELEC_GRP1'),
('STU_CE2_001', 'EG5_ELEC_GRP2'),
('STU_CE2_002', 'EG5_ELEC_GRP2'),
('STU_CSE2_001','EG5_ELEC_GRP2'),
('STU_CSE2_002','EG5_ELEC_GRP2'),
('STU_IT2_001', 'EG5_ELEC_GRP2'),
('STU_IT2_002', 'EG5_ELEC_GRP2');


-- ============================================================================
-- SECTION F — SEMESTERS 1–4: MINIMAL STUB STRUCTURE
-- Purpose: Enable semester selection UI without contaminating Sem 5 data.
-- All semester 1-4 data is [SYNTH] placeholder. No real curriculum is known.
-- ============================================================================

-- Minimal stub sections for Semesters 1-4 (6 sections each)
-- student_count = 84 as consistent with Sem 5 specification.

INSERT INTO sections (id, name, student_count, semester_id, department_id, section_code) VALUES
-- Semester 1
('S1_CE1', 'CE1', 84, 'SEM1', 'DEPT_CE',  'CE1'),
('S1_CE2', 'CE2', 84, 'SEM1', 'DEPT_CE',  'CE2'),
('S1_CSE1','CSE1',84, 'SEM1', 'DEPT_CSE', 'CSE1'),
('S1_CSE2','CSE2',84, 'SEM1', 'DEPT_CSE', 'CSE2'),
('S1_IT1', 'IT1', 84, 'SEM1', 'DEPT_IT',  'IT1'),
('S1_IT2', 'IT2', 84, 'SEM1', 'DEPT_IT',  'IT2'),
-- Semester 2
('S2_CE1', 'CE1', 84, 'SEM2', 'DEPT_CE',  'CE1'),
('S2_CE2', 'CE2', 84, 'SEM2', 'DEPT_CE',  'CE2'),
('S2_CSE1','CSE1',84, 'SEM2', 'DEPT_CSE', 'CSE1'),
('S2_CSE2','CSE2',84, 'SEM2', 'DEPT_CSE', 'CSE2'),
('S2_IT1', 'IT1', 84, 'SEM2', 'DEPT_IT',  'IT1'),
('S2_IT2', 'IT2', 84, 'SEM2', 'DEPT_IT',  'IT2'),
-- Semester 3
('S3_CE1', 'CE1', 84, 'SEM3', 'DEPT_CE',  'CE1'),
('S3_CE2', 'CE2', 84, 'SEM3', 'DEPT_CE',  'CE2'),
('S3_CSE1','CSE1',84, 'SEM3', 'DEPT_CSE', 'CSE1'),
('S3_CSE2','CSE2',84, 'SEM3', 'DEPT_CSE', 'CSE2'),
('S3_IT1', 'IT1', 84, 'SEM3', 'DEPT_IT',  'IT1'),
('S3_IT2', 'IT2', 84, 'SEM3', 'DEPT_IT',  'IT2'),
-- Semester 4
('S4_CE1', 'CE1', 84, 'SEM4', 'DEPT_CE',  'CE1'),
('S4_CE2', 'CE2', 84, 'SEM4', 'DEPT_CE',  'CE2'),
('S4_CSE1','CSE1',84, 'SEM4', 'DEPT_CSE', 'CSE1'),
('S4_CSE2','CSE2',84, 'SEM4', 'DEPT_CSE', 'CSE2'),
('S4_IT1', 'IT1', 84, 'SEM4', 'DEPT_IT',  'IT1'),
('S4_IT2', 'IT2', 84, 'SEM4', 'DEPT_IT',  'IT2');

-- Minimal lab batches for Semesters 1-4
-- (No students seeded for Sems 1-4 in this MVP step)
INSERT INTO lab_batches (id, section_id, batch_code, student_count) VALUES
-- Sem 1
('LB_S1_CE1_A','S1_CE1','A',21),('LB_S1_CE1_B','S1_CE1','B',21),
('LB_S1_CE1_C','S1_CE1','C',21),('LB_S1_CE1_D','S1_CE1','D',21),
('LB_S1_CE2_A','S1_CE2','A',21),('LB_S1_CE2_B','S1_CE2','B',21),
('LB_S1_CE2_C','S1_CE2','C',21),('LB_S1_CE2_D','S1_CE2','D',21),
('LB_S1_CSE1_A','S1_CSE1','A',21),('LB_S1_CSE1_B','S1_CSE1','B',21),
('LB_S1_CSE1_C','S1_CSE1','C',21),('LB_S1_CSE1_D','S1_CSE1','D',21),
('LB_S1_CSE2_A','S1_CSE2','A',21),('LB_S1_CSE2_B','S1_CSE2','B',21),
('LB_S1_CSE2_C','S1_CSE2','C',21),('LB_S1_CSE2_D','S1_CSE2','D',21),
('LB_S1_IT1_A','S1_IT1','A',21),('LB_S1_IT1_B','S1_IT1','B',21),
('LB_S1_IT1_C','S1_IT1','C',21),('LB_S1_IT1_D','S1_IT1','D',21),
('LB_S1_IT2_A','S1_IT2','A',21),('LB_S1_IT2_B','S1_IT2','B',21),
('LB_S1_IT2_C','S1_IT2','C',21),('LB_S1_IT2_D','S1_IT2','D',21),
-- Sem 2
('LB_S2_CE1_A','S2_CE1','A',21),('LB_S2_CE1_B','S2_CE1','B',21),
('LB_S2_CE1_C','S2_CE1','C',21),('LB_S2_CE1_D','S2_CE1','D',21),
('LB_S2_CE2_A','S2_CE2','A',21),('LB_S2_CE2_B','S2_CE2','B',21),
('LB_S2_CE2_C','S2_CE2','C',21),('LB_S2_CE2_D','S2_CE2','D',21),
('LB_S2_CSE1_A','S2_CSE1','A',21),('LB_S2_CSE1_B','S2_CSE1','B',21),
('LB_S2_CSE1_C','S2_CSE1','C',21),('LB_S2_CSE1_D','S2_CSE1','D',21),
('LB_S2_CSE2_A','S2_CSE2','A',21),('LB_S2_CSE2_B','S2_CSE2','B',21),
('LB_S2_CSE2_C','S2_CSE2','C',21),('LB_S2_CSE2_D','S2_CSE2','D',21),
('LB_S2_IT1_A','S2_IT1','A',21),('LB_S2_IT1_B','S2_IT1','B',21),
('LB_S2_IT1_C','S2_IT1','C',21),('LB_S2_IT1_D','S2_IT1','D',21),
('LB_S2_IT2_A','S2_IT2','A',21),('LB_S2_IT2_B','S2_IT2','B',21),
('LB_S2_IT2_C','S2_IT2','C',21),('LB_S2_IT2_D','S2_IT2','D',21),
-- Sem 3
('LB_S3_CE1_A','S3_CE1','A',21),('LB_S3_CE1_B','S3_CE1','B',21),
('LB_S3_CE1_C','S3_CE1','C',21),('LB_S3_CE1_D','S3_CE1','D',21),
('LB_S3_CE2_A','S3_CE2','A',21),('LB_S3_CE2_B','S3_CE2','B',21),
('LB_S3_CE2_C','S3_CE2','C',21),('LB_S3_CE2_D','S3_CE2','D',21),
('LB_S3_CSE1_A','S3_CSE1','A',21),('LB_S3_CSE1_B','S3_CSE1','B',21),
('LB_S3_CSE1_C','S3_CSE1','C',21),('LB_S3_CSE1_D','S3_CSE1','D',21),
('LB_S3_CSE2_A','S3_CSE2','A',21),('LB_S3_CSE2_B','S3_CSE2','B',21),
('LB_S3_CSE2_C','S3_CSE2','C',21),('LB_S3_CSE2_D','S3_CSE2','D',21),
('LB_S3_IT1_A','S3_IT1','A',21),('LB_S3_IT1_B','S3_IT1','B',21),
('LB_S3_IT1_C','S3_IT1','C',21),('LB_S3_IT1_D','S3_IT1','D',21),
('LB_S3_IT2_A','S3_IT2','A',21),('LB_S3_IT2_B','S3_IT2','B',21),
('LB_S3_IT2_C','S3_IT2','C',21),('LB_S3_IT2_D','S3_IT2','D',21),
-- Sem 4
('LB_S4_CE1_A','S4_CE1','A',21),('LB_S4_CE1_B','S4_CE1','B',21),
('LB_S4_CE1_C','S4_CE1','C',21),('LB_S4_CE1_D','S4_CE1','D',21),
('LB_S4_CE2_A','S4_CE2','A',21),('LB_S4_CE2_B','S4_CE2','B',21),
('LB_S4_CE2_C','S4_CE2','C',21),('LB_S4_CE2_D','S4_CE2','D',21),
('LB_S4_CSE1_A','S4_CSE1','A',21),('LB_S4_CSE1_B','S4_CSE1','B',21),
('LB_S4_CSE1_C','S4_CSE1','C',21),('LB_S4_CSE1_D','S4_CSE1','D',21),
('LB_S4_CSE2_A','S4_CSE2','A',21),('LB_S4_CSE2_B','S4_CSE2','B',21),
('LB_S4_CSE2_C','S4_CSE2','C',21),('LB_S4_CSE2_D','S4_CSE2','D',21),
('LB_S4_IT1_A','S4_IT1','A',21),('LB_S4_IT1_B','S4_IT1','B',21),
('LB_S4_IT1_C','S4_IT1','C',21),('LB_S4_IT1_D','S4_IT1','D',21),
('LB_S4_IT2_A','S4_IT2','A',21),('LB_S4_IT2_B','S4_IT2','B',21),
('LB_S4_IT2_C','S4_IT2','C',21),('LB_S4_IT2_D','S4_IT2','D',21);


-- ============================================================================
-- SECTION G — ORIGINAL SANDBOX SOLVER TEST DATA (preserved)
-- These records do NOT belong to any semester (semester_id = NULL).
-- They exist to keep the existing /api/timetable/generate endpoint working
-- with the sample data hardcoded in the frontend (SAMPLE_DATA in api.ts).
-- ============================================================================

-- Original timeslots are now replaced by the institutional 30-slot grid (Sec C).
-- The sandbox test data uses timeslot IDs 0-11.
-- IDs 0-11 already exist in Section C (Monday 09:10–Friday 15:20 first 12 slots).
-- The solver's SAMPLE_DATA (Mon/Tue/Wed, 09:00/11:00/13:00/15:00) maps to
-- different time strings but the INTEGER IDs (0-11) are compatible for the test.

-- Original sandbox rooms (no semester link)
INSERT INTO rooms (id, name, capacity, is_lab, room_type) VALUES
('R1', 'Small Room',   30,  FALSE, 'lecture'),
('R2', 'Medium Room',  60,  FALSE, 'lecture'),
('R3', 'Lecture Hall', 120, FALSE, 'lecture'),
('L1', 'Computer Lab', 40,  TRUE,  'lab');

-- Original sandbox courses (no semester link)
INSERT INTO courses (id, name, requires_lab, course_code, credits, course_type, weekly_hours) VALUES
('C1', 'Intro to CS', TRUE,  'C1', 0, 'practical', 2),
('C2', 'Calculus I',  FALSE, 'C2', 0, 'theory',    3),
('C3', 'Physics I',   FALSE, 'C3', 0, 'theory',    3);

-- Original sandbox sections (no semester link)
INSERT INTO sections (id, name, student_count, section_code) VALUES
('S1', 'Section A', 25, 'Section A'),
('S2', 'Section B', 55, 'Section B'),
('S3', 'Section C', 100,'Section C');

-- Original sandbox faculty (no semester link)
INSERT INTO faculty (id, name) VALUES
('F1', 'Dr. Smith'),
('F2', 'Dr. Jones'),
('F3', 'Dr. Brown');

-- Original sandbox faculty availability (timeslot IDs 0-11)
INSERT INTO faculty_availability (faculty_id, timeslot_id, is_preferred) VALUES
('F1', 0, TRUE), ('F1', 1, TRUE), ('F1', 2, FALSE), ('F1', 3, FALSE),
('F1', 4, TRUE), ('F1', 5, TRUE), ('F1', 6, FALSE), ('F1', 7, FALSE),
('F1', 8, TRUE), ('F1', 9, TRUE), ('F1', 10, FALSE), ('F1', 11, FALSE),
('F2', 0, TRUE), ('F2', 1, TRUE), ('F2', 2, FALSE), ('F2', 3, FALSE),
('F2', 4, TRUE), ('F2', 5, TRUE), ('F2', 6, FALSE), ('F2', 7, FALSE),
('F3', 0, FALSE),('F3', 1, FALSE),('F3', 2, TRUE), ('F3', 3, TRUE),
('F3', 4, FALSE),('F3', 5, FALSE),('F3', 6, TRUE), ('F3', 7, TRUE),
('F3', 8, FALSE),('F3', 9, FALSE),('F3', 10, TRUE),('F3', 11, TRUE);

-- Original sandbox course assignments
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('A1', 'S1', 'C1', 'F2', 2),
('A2', 'S1', 'C2', 'F1', 2),
('A3', 'S2', 'C2', 'F1', 3),
('A4', 'S3', 'C3', 'F3', 3);


-- ============================================================================
-- INTEGRITY VERIFICATION QUERIES (run after seeding to confirm structure)
-- Execute these manually against the database to validate seed integrity.
-- ============================================================================
--
-- 1. Confirm 3 departments:
--    SELECT COUNT(*) FROM departments;                   -- Expected: 3
--
-- 2. Confirm 6 Sem 5 sections:
--    SELECT COUNT(*) FROM sections WHERE semester_id='SEM5'; -- Expected: 6
--
-- 3. Confirm 24 Sem 5 lab batches:
--    SELECT COUNT(*) FROM lab_batches
--    WHERE section_id LIKE 'S5_%';                        -- Expected: 24
--
-- 4. Confirm aggregate section size = 504 students:
--    SELECT SUM(student_count) FROM sections
--    WHERE semester_id='SEM5';                            -- Expected: 504
--
-- 5. Confirm no batch belongs to wrong section:
--    SELECT lb.id FROM lab_batches lb
--    JOIN sections s ON lb.section_id = s.id
--    WHERE s.semester_id != 'SEM5' AND lb.section_id LIKE 'S5_%'; -- Expected: 0 rows
--
-- 6. Confirm no course assignment crosses semesters:
--    SELECT ca.id, c.semester_id, s.semester_id AS section_sem
--    FROM course_assignments ca
--    JOIN courses c ON ca.course_id = c.id
--    JOIN sections s ON ca.section_id = s.id
--    WHERE c.semester_id IS NOT NULL
--      AND s.semester_id IS NOT NULL
--      AND c.semester_id != s.semester_id;               -- Expected: 0 rows
--
-- 7. Confirm sandbox data intact:
--    SELECT COUNT(*) FROM course_assignments WHERE faculty_id IN ('F1','F2','F3');
--    -- Expected: 4
-- ============================================================================
