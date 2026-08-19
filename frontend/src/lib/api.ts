// Central API client for the CredWeave AI Timetable Generator FastAPI backend.
// All original types and SAMPLE_DATA are fully preserved for backward compatibility.
// New hierarchical types are added below the originals.
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Original Solver Types (preserved — solver endpoints use these) ──────────

export interface TimeSlot {
  id: number;
  day: string;
  time: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  is_lab: boolean;
  // Optional enriched field; solver ignores it
  room_type?: "lecture" | "lab" | "hall";
}

export interface Faculty {
  id: string;
  name: string;
  available_timeslots: number[];
  preferred_timeslots: number[];
  department_id?: string;
}

export interface Course {
  id: string;
  name: string;
  requires_lab: boolean;
  // Optional extended fields; solver ignores these
  course_code?: string;
  credits?: number;
  course_type?: "theory" | "practical";
  weekly_hours?: number;
  semester_id?: string;
  department_id?: string;
  is_elective?: boolean;
}

export interface Section {
  id: string;
  name: string;
  student_count: number;
  // Optional extended fields; solver ignores these
  semester_id?: string;
  department_id?: string;
  section_code?: string;
}

export interface Assignment {
  id: string;
  section_id: string;
  course_id: string;
  faculty_id: string;
  weekly_periods: number;
  // Optional extended fields
  elective_group_id?: string;
  lab_batch_id?: string;
}

export interface ScheduledClass {
  assignment_id: string;
  period_idx: number;
  timeslot_id: number;
  room_id: string;
}

export interface ScheduleMetrics {
  total_gaps: number;
  faculty_imbalance: number;
  room_utilization_penalty: number;
  preference_violations: number;
  total_penalty: number;
  quality_score: number;
}

export interface TimetableResponse {
  status: string;
  message: string;
  schedule: ScheduledClass[];
  is_valid: boolean;
  errors: string[];
  metrics: ScheduleMetrics | null;
}

export interface GenerateRequest {
  timeslots: TimeSlot[];
  rooms: Room[];
  faculty: Faculty[];
  courses: Course[];
  sections: Section[];
  assignments: Assignment[];
}

// ─── Default sample data (mirrors data_generator.py — PRESERVED UNCHANGED) ──
// This is the original sandbox test dataset. It uses timeslot IDs 0-11
// which map to the first 12 institutional timeslots in the updated schema.
// DO NOT modify this object — it must remain compatible with the live sandbox
// solver endpoint at /api/timetable/generate.

export const SAMPLE_DATA: GenerateRequest = {
  timeslots: [
    { id: 0, day: "Monday",    time: "09:00" },
    { id: 1, day: "Monday",    time: "11:00" },
    { id: 2, day: "Monday",    time: "13:00" },
    { id: 3, day: "Monday",    time: "15:00" },
    { id: 4, day: "Tuesday",   time: "09:00" },
    { id: 5, day: "Tuesday",   time: "11:00" },
    { id: 6, day: "Tuesday",   time: "13:00" },
    { id: 7, day: "Tuesday",   time: "15:00" },
    { id: 8, day: "Wednesday", time: "09:00" },
    { id: 9, day: "Wednesday", time: "11:00" },
    { id: 10, day: "Wednesday", time: "13:00" },
    { id: 11, day: "Wednesday", time: "15:00" },
  ],
  rooms: [
    { id: "R1", name: "Small Room",   capacity: 30,  is_lab: false },
    { id: "R2", name: "Medium Room",  capacity: 60,  is_lab: false },
    { id: "R3", name: "Lecture Hall", capacity: 120, is_lab: false },
    { id: "L1", name: "Computer Lab", capacity: 40,  is_lab: true  },
  ],
  courses: [
    { id: "C1", name: "Intro to CS", requires_lab: true  },
    { id: "C2", name: "Calculus I",  requires_lab: false },
    { id: "C3", name: "Physics I",   requires_lab: false },
  ],
  sections: [
    { id: "S1", name: "Section A", student_count: 25  },
    { id: "S2", name: "Section B", student_count: 55  },
    { id: "S3", name: "Section C", student_count: 100 },
  ],
  faculty: [
    {
      id: "F1",
      name: "Dr. Smith",
      available_timeslots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      preferred_timeslots: [0, 1, 4, 5, 8, 9],
    },
    {
      id: "F2",
      name: "Dr. Jones",
      available_timeslots: [0, 1, 2, 3, 4, 5, 6, 7],
      preferred_timeslots: [0, 1, 4, 5],
    },
    {
      id: "F3",
      name: "Dr. Brown",
      available_timeslots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      preferred_timeslots: [2, 3, 6, 7, 10, 11],
    },
  ],
  assignments: [
    { id: "A1", section_id: "S1", course_id: "C1", faculty_id: "F2", weekly_periods: 2 },
    { id: "A2", section_id: "S1", course_id: "C2", faculty_id: "F1", weekly_periods: 2 },
    { id: "A3", section_id: "S2", course_id: "C2", faculty_id: "F1", weekly_periods: 3 },
    { id: "A4", section_id: "S3", course_id: "C3", faculty_id: "F3", weekly_periods: 3 },
  ],
};

// ─── New Hierarchical Types (CredWeave NEP 2020 academic model) ──────────────
// These types are used by the data layer, admin pages, and future endpoints.
// They do NOT replace or modify the solver payload types above.

export interface Semester {
  id: string;
  semester_number: number;     // 1–5
  name: string;                // e.g. "Semester 5"
  academic_year: string;       // e.g. "2026-27"
  is_active: boolean;
}

export interface Department {
  id: string;
  code: string;                // "CE" | "CSE" | "IT"
  name: string;
}

export interface LabBatch {
  id: string;
  section_id: string;
  batch_code: "A" | "B" | "C" | "D";
  student_count: number;
}

export interface Student {
  id: string;
  roll_number: string;
  name: string;
  section_id: string;
  semester_id: string;
  lab_batch_id?: string;
}

export interface ElectiveGroup {
  id: string;
  semester_id: string;
  course_id: string;
  name: string;
  capacity: number;
  enrolled_count: number;
}

export interface HierarchyDepartment {
  id: string;
  code: string;
  name: string;
  section_count: number;
  student_count: number;
  sections: Array<{
    id: string;
    name: string;
    student_count: number;
    department_id: string;
    section_code: string;
    dept_code: string;
    batch_count: number;
  }>;
}

export interface HierarchySection {
  id: string;
  name: string;
  student_count: number;
  department_id: string;
  section_code: string;
  dept_code: string;
  batch_count: number;
  lab_batches?: Array<{
    id: string;
    section_id?: string;
    batch_code: string;
    student_count: number;
  }>;
  assignments?: Array<{
    id: string;
    section_id: string;
    course_id: string;
    course_name: string;
    course_code: string;
    course_type: string;
    requires_lab: boolean;
    is_elective: boolean;
    faculty_id: string;
    faculty_name: string;
    weekly_periods: number;
    elective_group_id?: string;
    lab_batch_id?: string;
  }>;
}

export interface HierarchyElectiveGroup {
  id: string;
  semester_id: string;
  course_id?: string;
  name: string;
  capacity: number;
  enrolled_count: number;
  options?: Array<{
    assignment_id: string;
    section_id: string;
    course_id: string;
    course_name: string;
    course_code: string;
    dept_code: string;
    faculty_id: string;
    faculty_name: string;
    weekly_periods: number;
  }>;
}

export interface HierarchySummary {
  semester_id: string;
  semester_number: number;
  semester_name: string;
  academic_year: string;
  is_active: boolean;
  total_departments: number;
  total_sections: number;
  total_students: number;
  total_lab_batches: number;
  total_courses: number;
  total_elective_groups: number;
  total_faculty_assigned: number;
  departments: HierarchyDepartment[];
  sections: HierarchySection[];
  elective_groups: HierarchyElectiveGroup[];
  data_classification: string;
}


// ─── API functions (original — preserved) ────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; message: string }> {
  const { data } = await api.get("/health");
  return data;
}

export async function generateTimetable(req: GenerateRequest): Promise<TimetableResponse> {
  const { data } = await api.post("/api/timetable/generate", req);
  return data;
}

export async function validateTimetable(
  req: GenerateRequest & { schedule: ScheduledClass[] }
): Promise<TimetableResponse> {
  const { data } = await api.post("/api/timetable/validate", req);
  return data;
}

export async function reoptimizeTimetable(req: GenerateRequest): Promise<TimetableResponse> {
  const { data } = await api.post("/api/timetable/reoptimize", req);
  return data;
}

export async function getActiveTimetable(): Promise<ScheduledClass[]> {
  const { data } = await api.get("/api/timetable/active");
  return data;
}

// ─── Hierarchical API functions (Step 2/3) ──────────────────────────────────

export async function getSemesters(): Promise<Semester[]> {
  const { data } = await api.get("/api/hierarchy/semesters");
  return data;
}

export async function getHierarchySummary(semesterId: string): Promise<HierarchySummary> {
  const { data } = await api.get(`/api/hierarchy/${semesterId}`);
  return data;
}

export async function getSemesterInputData(semesterId: string): Promise<GenerateRequest> {
  const { data } = await api.get(`/api/hierarchy/${semesterId}/data`);
  return data;
}

export async function generateSemesterTimetable(
  semesterId: string,
  scheduleName: string = "Semester Schedule"
): Promise<TimetableResponse> {
  const { data } = await api.post(
    `/api/timetable/generate-semester?schedule_name=${encodeURIComponent(scheduleName)}`,
    { semester_id: semesterId }
  );
  return data;
}

// ─── Step 4B: Faculty & Student Read-Only Views ──────────────────────────────

export interface FacultyScheduleItem {
  assignment_id: string;
  course_name: string;
  course_code: string;
  section_name: string;
  batch_code?: string;
  is_lab: boolean;
  timeslot_id: number;
  day: string;
  time: string;
  room_name: string;
  period_idx: number;
}

export interface FacultyDetail {
  id: string;
  name: string;
  department_id: string;
  dept_code: string;
  dept_name: string;
  total_weekly_periods: number;
  assigned_courses: Array<{
    course_id: string;
    course_name: string;
    course_code: string;
    course_type: string;
    requires_lab: boolean;
    is_elective: boolean;
  }>;
  assigned_sections: Array<{
    section_id: string;
    section_name: string;
    dept_code: string;
  }>;
  teaching_assignments: Array<{
    id: string;
    faculty_id: string;
    section_id: string;
    course_id: string;
    weekly_periods: number;
    elective_group_id?: string;
    lab_batch_id?: string;
    section_name: string;
    student_count: number;
    course_name: string;
    course_code: string;
    course_type: string;
    requires_lab: boolean;
    is_elective: boolean;
    dept_code: string;
    batch_code?: string;
  }>;
  schedule: FacultyScheduleItem[];
  has_schedule: boolean;
}

export interface StudentScheduleItem {
  assignment_id: string;
  course_name: string;
  course_code: string;
  is_lab: boolean;
  is_elective: boolean;
  elective_group_name?: string;
  faculty_name: string;
  timeslot_id: number;
  day: string;
  time: string;
  room_name: string;
}

export interface StudentDetail {
  id: string;
  roll_number: string;
  name: string;
  section_id: string;
  section_name: string;
  dept_code: string;
  dept_name: string;
  semester_id: string;
  lab_batch_id: string;
  batch_code: string;
  enrolled_elective?: {
    student_id: string;
    elective_group_id: string;
    elective_group_name: string;
    capacity: number;
  };
  available_elective_groups: Array<{
    id: string;
    name: string;
    capacity: number;
    enrolled_count: number;
  }>;
  compulsory_courses: Array<{
    id: string;
    section_id: string;
    course_id: string;
    faculty_id: string;
    weekly_periods: number;
    elective_group_id?: string;
    lab_batch_id?: string;
    course_name: string;
    course_code: string;
    course_type: string;
    requires_lab: boolean;
    is_elective: boolean;
    faculty_name: string;
  }>;
  schedule: StudentScheduleItem[];
  has_schedule: boolean;
}

export interface SemesterFacultyResponse {
  semester_id: string;
  total_assigned_faculty: number;
  total_institutional_faculty: number;
  faculty: FacultyDetail[];
  data_classification?: string;
}

export interface SemesterStudentsResponse {
  semester_id: string;
  cohort_student_count: number;
  total_registered_students: number;
  students: StudentDetail[];
  data_classification?: string;
}

export async function getSemesterFaculty(semesterId: string): Promise<SemesterFacultyResponse> {
  const { data } = await api.get(`/api/hierarchy/${semesterId}/faculty`);
  return data;
}

export async function getSemesterStudents(semesterId: string): Promise<SemesterStudentsResponse> {
  const { data } = await api.get(`/api/hierarchy/${semesterId}/students`);
  return data;
}

