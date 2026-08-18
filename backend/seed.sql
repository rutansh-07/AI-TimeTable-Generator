-- Seed Data for AI-Based Timetable Generator
-- Populates the tables with the standard test dataset matching data_generator.py

-- 1. Seed Timeslots (3 days, 4 slots each = 12 slots)
INSERT INTO timeslots (id, day, time) VALUES
(0, 'Monday', '09:00'),
(1, 'Monday', '11:00'),
(2, 'Monday', '13:00'),
(3, 'Monday', '15:00'),
(4, 'Tuesday', '09:00'),
(5, 'Tuesday', '11:00'),
(6, 'Tuesday', '13:00'),
(7, 'Tuesday', '15:00'),
(8, 'Wednesday', '09:00'),
(9, 'Wednesday', '11:00'),
(10, 'Wednesday', '13:00'),
(11, 'Wednesday', '15:00');

-- 2. Seed Rooms
INSERT INTO rooms (id, name, capacity, is_lab) VALUES
('R1', 'Small Room', 30, FALSE),
('R2', 'Medium Room', 60, FALSE),
('R3', 'Lecture Hall', 120, FALSE),
('L1', 'Computer Lab', 40, TRUE);

-- 3. Seed Courses
INSERT INTO courses (id, name, requires_lab) VALUES
('C1', 'Intro to CS', TRUE),
('C2', 'Calculus I', FALSE),
('C3', 'Physics I', FALSE);

-- 4. Seed Sections
INSERT INTO sections (id, name, student_count) VALUES
('S1', 'Section A', 25),
('S2', 'Section B', 55),
('S3', 'Section C', 100);

-- 5. Seed Faculty
INSERT INTO faculty (id, name) VALUES
('F1', 'Dr. Smith'),
('F2', 'Dr. Jones'),
('F3', 'Dr. Brown');

-- 6. Seed Faculty Availability and Preferences
-- F1 (Dr. Smith): available all 12 slots, preferred: 0, 1, 4, 5, 8, 9
INSERT INTO faculty_availability (faculty_id, timeslot_id, is_preferred) VALUES
('F1', 0, TRUE), ('F1', 1, TRUE), ('F1', 2, FALSE), ('F1', 3, FALSE),
('F1', 4, TRUE), ('F1', 5, TRUE), ('F1', 6, FALSE), ('F1', 7, FALSE),
('F1', 8, TRUE), ('F1', 9, TRUE), ('F1', 10, FALSE), ('F1', 11, FALSE);

-- F2 (Dr. Jones): available only 0-7, preferred: 0, 1, 4, 5
INSERT INTO faculty_availability (faculty_id, timeslot_id, is_preferred) VALUES
('F2', 0, TRUE), ('F2', 1, TRUE), ('F2', 2, FALSE), ('F2', 3, FALSE),
('F2', 4, TRUE), ('F2', 5, TRUE), ('F2', 6, FALSE), ('F2', 7, FALSE);

-- F3 (Dr. Brown): available all 12 slots, preferred: 2, 3, 6, 7, 10, 11
INSERT INTO faculty_availability (faculty_id, timeslot_id, is_preferred) VALUES
('F3', 0, FALSE), ('F3', 1, FALSE), ('F3', 2, TRUE), ('F3', 3, TRUE),
('F3', 4, FALSE), ('F3', 5, FALSE), ('F3', 6, TRUE), ('F3', 7, TRUE),
('F3', 8, FALSE), ('F3', 9, FALSE), ('F3', 10, TRUE), ('F3', 11, TRUE);

-- 7. Seed Course Assignments
INSERT INTO course_assignments (id, section_id, course_id, faculty_id, weekly_periods) VALUES
('A1', 'S1', 'C1', 'F2', 2), -- Intro to CS (Lab course) for S1, taught by Dr. Jones
('A2', 'S1', 'C2', 'F1', 2), -- Calculus I for S1, taught by Dr. Smith
('A3', 'S2', 'C2', 'F1', 3), -- Calculus I for S2, taught by Dr. Smith
('A4', 'S3', 'C3', 'F3', 3); -- Physics I for S3, taught by Dr. Brown
