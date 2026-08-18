-- Database Schema for AI-Based Timetable Generator

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS scheduled_classes CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS course_assignments CASCADE;
DROP TABLE IF EXISTS faculty_availability CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS timeslots CASCADE;

-- 1. Timeslots Table
CREATE TABLE timeslots (
    id INTEGER PRIMARY KEY,
    day VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL
);

-- 2. Rooms Table
CREATE TABLE rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE
);

-- 3. Courses Table
CREATE TABLE courses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    requires_lab BOOLEAN DEFAULT FALSE
);

-- 4. Sections Table
CREATE TABLE sections (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_count INTEGER NOT NULL
);

-- 5. Faculty Table
CREATE TABLE faculty (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 6. Faculty Availability Table
-- Maps timeslot availability (and preferences) for each faculty member
CREATE TABLE faculty_availability (
    faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE CASCADE,
    timeslot_id INTEGER REFERENCES timeslots(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (faculty_id, timeslot_id)
);

-- 7. Course Assignments Table
-- Links sections, courses, faculty, and weekly periods requirements
CREATE TABLE course_assignments (
    id VARCHAR(50) PRIMARY KEY,
    section_id VARCHAR(50) REFERENCES sections(id) ON DELETE CASCADE,
    course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE CASCADE,
    weekly_periods INTEGER NOT NULL
);

-- 8. Schedules Table
-- Tracks different timetable generations (history/runs)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE
);

-- 9. Scheduled Classes Table
-- Stores the final assignments of courses to timeslots and rooms
CREATE TABLE scheduled_classes (
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    assignment_id VARCHAR(50) REFERENCES course_assignments(id) ON DELETE CASCADE,
    period_idx INTEGER NOT NULL,
    timeslot_id INTEGER REFERENCES timeslots(id) ON DELETE CASCADE,
    room_id VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (schedule_id, assignment_id, period_idx)
);
