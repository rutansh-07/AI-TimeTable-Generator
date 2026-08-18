"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import {
  AlertTriangle,
  HelpCircle,
  Clock,
  Building2,
  Users,
  FlaskConical,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message?: string;
  errors?: string[];
}

export function InfeasibilityExplanation({ message, errors = [] }: Props) {
  const { inputData, loadSampleData } = useApp();

  // Run heuristics on inputData to detect likely conflict root causes
  const diagnostics: {
    title: string;
    description: string;
    icon: React.ElementType;
    severity: "high" | "medium" | "info";
    fix: string;
  }[] = [];

  const totalSessions = inputData.assignments.reduce(
    (acc, curr) => acc + curr.weekly_periods,
    0
  );
  const totalSlots = inputData.timeslots.length;
  const totalRooms = inputData.rooms.length;
  const maxRoomCapacity = Math.max(...inputData.rooms.map((r) => r.capacity), 0);
  const labRooms = inputData.rooms.filter((r) => r.is_lab);

  // 1. Capacity diagnostic
  inputData.sections.forEach((sec) => {
    if (sec.student_count > maxRoomCapacity) {
      diagnostics.push({
        title: `Section "${sec.name}" Exceeds Max Room Capacity`,
        description: `Section has ${sec.student_count} students, but the largest room only seats ${maxRoomCapacity}.`,
        icon: Users,
        severity: "high",
        fix: `Increase capacity of a room or split section "${sec.name}" into smaller cohorts.`,
      });
    }
  });

  // 2. Faculty availability diagnostic
  inputData.faculty.forEach((f) => {
    const requiredPeriods = inputData.assignments
      .filter((a) => a.faculty_id === f.id)
      .reduce((sum, a) => sum + a.weekly_periods, 0);

    if (requiredPeriods > f.available_timeslots.length) {
      diagnostics.push({
        title: `Faculty "${f.name}" Availability Deficit`,
        description: `Assigned ${requiredPeriods} weekly periods but is only available for ${f.available_timeslots.length} timeslots.`,
        icon: Clock,
        severity: "high",
        fix: `Add more available timeslots for ${f.name} in Faculty Settings or reassign courses.`,
      });
    }
  });

  // 3. Lab requirement diagnostic
  const labSessions = inputData.assignments
    .filter((a) => {
      const c = inputData.courses.find((course) => course.id === a.course_id);
      return c?.requires_lab;
    })
    .reduce((sum, a) => sum + a.weekly_periods, 0);

  const totalLabCapacitySlots = labRooms.length * totalSlots;

  if (labSessions > totalLabCapacitySlots) {
    diagnostics.push({
      title: `Lab Classroom Deficit`,
      description: `Need ${labSessions} lab periods, but available lab capacity is ${totalLabCapacitySlots} (${labRooms.length} labs × ${totalSlots} slots).`,
      icon: FlaskConical,
      severity: "high",
      fix: `Convert a room to Lab type or increase available lab timeslots.`,
    });
  }

  // 4. Overall slot saturation
  const totalRoomSlots = totalRooms * totalSlots;
  if (totalSessions > totalRoomSlots) {
    diagnostics.push({
      title: `Total Sessions Exceed Campus Capacity`,
      description: `Total class sessions (${totalSessions}) exceeds absolute theoretical capacity (${totalRoomSlots} room-slots).`,
      icon: Building2,
      severity: "high",
      fix: `Add more rooms or expand the schedule to more days/timeslots.`,
    });
  }

  return (
    <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* Failure Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-rose-100">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-rose-900">
              No Feasible Timetable Found (Solver Infeasible)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Flowchart: EXPLANATION Branch
            </span>
          </div>
          <p className="text-xs text-rose-700 mt-1">
            {message ||
              "The CP-SAT solver proved that the current hard constraints are mathematically contradictory."}
          </p>
        </div>
      </div>

      {/* Backend Reported Errors */}
      {errors.length > 0 && (
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <h4 className="text-xs font-semibold text-rose-900 mb-2">
            Solver Conflict Report:
          </h4>
          <ul className="space-y-1 list-disc list-inside text-xs text-rose-700">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Automated Infeasibility Root-Cause Diagnostics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            Automated Infeasibility Diagnostics & Recommendations
          </h4>
          <span className="text-xs text-slate-400">
            {diagnostics.length > 0
              ? `${diagnostics.length} conflict(s) detected`
              : "Analyzing constraint matrix"}
          </span>
        </div>

        {diagnostics.length > 0 ? (
          <div className="space-y-3">
            {diagnostics.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
                  d.severity === "high"
                    ? "bg-rose-50/50 border-rose-200"
                    : "bg-amber-50/50 border-amber-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      d.severity === "high"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    <d.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">{d.title}</h5>
                    <p className="text-slate-600 mt-0.5">{d.description}</p>
                    <p className="text-blue-700 font-medium mt-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Fix: {d.fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-medium text-slate-800">
              Multiple overlapping constraints are causing a bottleneck.
            </p>
            <p>
              Common causes include tight faculty availability intersecting with section schedules, or multiple sections demanding the same room/slot simultaneously.
            </p>
          </div>
        )}
      </div>

      {/* Action to recover */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Want to test with a verified working dataset?
        </p>
        <button
          onClick={loadSampleData}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Reset to Sample Data
        </button>
      </div>
    </div>
  );
}
