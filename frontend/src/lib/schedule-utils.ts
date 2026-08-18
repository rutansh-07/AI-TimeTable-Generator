import { ScheduledClass, GenerateRequest, ScheduleMetrics } from "@/lib/api";

export type ViewMode = "master" | "section" | "faculty" | "room";

export interface EnrichedClass {
  sc: ScheduledClass;
  courseName: string;
  courseId: string;
  facultyName: string;
  facultyId: string;
  sectionName: string;
  sectionId: string;
  roomName: string;
  roomId: string;
  day: string;
  time: string;
  isLab: boolean;
}

const COURSE_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-violet-100 border-violet-300 text-violet-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-rose-100 border-rose-300 text-rose-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-teal-100 border-teal-300 text-teal-800",
];

export function getCourseColor(courseId: string): string {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) hash += courseId.charCodeAt(i);
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

export function enrichSchedule(
  schedule: ScheduledClass[],
  data: GenerateRequest
): EnrichedClass[] {
  const courseMap = Object.fromEntries(data.courses.map((c) => [c.id, c]));
  const facultyMap = Object.fromEntries(data.faculty.map((f) => [f.id, f]));
  const sectionMap = Object.fromEntries(data.sections.map((s) => [s.id, s]));
  const roomMap = Object.fromEntries(data.rooms.map((r) => [r.id, r]));
  const timeslotMap = Object.fromEntries(data.timeslots.map((t) => [t.id, t]));
  const assignmentMap = Object.fromEntries(data.assignments.map((a) => [a.id, a]));

  return schedule.map((sc) => {
    const assignment = assignmentMap[sc.assignment_id];
    const course = courseMap[assignment?.course_id] ?? { name: "?", id: "?", requires_lab: false };
    const faculty = facultyMap[assignment?.faculty_id] ?? { name: "?", id: "?" };
    const section = sectionMap[assignment?.section_id] ?? { name: "?", id: "?" };
    const room = roomMap[sc.room_id] ?? { name: "?", id: "?", is_lab: false };
    const ts = timeslotMap[sc.timeslot_id] ?? { day: "?", time: "?" };
    return {
      sc,
      courseName: course.name,
      courseId: course.id,
      facultyName: faculty.name,
      facultyId: faculty.id,
      sectionName: section.name,
      sectionId: section.id,
      roomName: room.name,
      roomId: sc.room_id,
      day: ts.day,
      time: ts.time,
      isLab: room.is_lab,
    };
  });
}

export function getQualityLabel(score: number): { label: string; color: string } {
  if (score >= 9500) return { label: "Excellent", color: "text-emerald-600" };
  if (score >= 8500) return { label: "Good", color: "text-blue-600" };
  if (score >= 7000) return { label: "Fair", color: "text-amber-600" };
  return { label: "Poor", color: "text-rose-600" };
}

export function getQualityBarColor(score: number): string {
  if (score >= 9500) return "bg-emerald-500";
  if (score >= 8500) return "bg-blue-500";
  if (score >= 7000) return "bg-amber-500";
  return "bg-rose-500";
}
