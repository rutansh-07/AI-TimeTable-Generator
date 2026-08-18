// Central API client for the FastAPI backend
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

export interface Faculty {
  id: string;
  name: string;
  available_timeslots: number[];
  preferred_timeslots: number[];
}

export interface Course {
  id: string;
  name: string;
  requires_lab: boolean;
}

export interface Section {
  id: string;
  name: string;
  student_count: number;
}

export interface Assignment {
  id: string;
  section_id: string;
  course_id: string;
  faculty_id: string;
  weekly_periods: number;
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

// ─── Default sample data (mirrors data_generator.py) ─────────────────────────

export const SAMPLE_DATA: GenerateRequest = {
  timeslots: [
    { id: 0, day: "Monday", time: "09:00" },
    { id: 1, day: "Monday", time: "11:00" },
    { id: 2, day: "Monday", time: "13:00" },
    { id: 3, day: "Monday", time: "15:00" },
    { id: 4, day: "Tuesday", time: "09:00" },
    { id: 5, day: "Tuesday", time: "11:00" },
    { id: 6, day: "Tuesday", time: "13:00" },
    { id: 7, day: "Tuesday", time: "15:00" },
    { id: 8, day: "Wednesday", time: "09:00" },
    { id: 9, day: "Wednesday", time: "11:00" },
    { id: 10, day: "Wednesday", time: "13:00" },
    { id: 11, day: "Wednesday", time: "15:00" },
  ],
  rooms: [
    { id: "R1", name: "Small Room", capacity: 30, is_lab: false },
    { id: "R2", name: "Medium Room", capacity: 60, is_lab: false },
    { id: "R3", name: "Lecture Hall", capacity: 120, is_lab: false },
    { id: "L1", name: "Computer Lab", capacity: 40, is_lab: true },
  ],
  courses: [
    { id: "C1", name: "Intro to CS", requires_lab: true },
    { id: "C2", name: "Calculus I", requires_lab: false },
    { id: "C3", name: "Physics I", requires_lab: false },
  ],
  sections: [
    { id: "S1", name: "Section A", student_count: 25 },
    { id: "S2", name: "Section B", student_count: 55 },
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

// ─── API functions ─────────────────────────────────────────────────────────────

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
