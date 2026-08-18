"use client";
import React, { useState } from "react";
import { ScheduledClass, GenerateRequest } from "@/lib/api";
import { enrichSchedule, getCourseColor, ViewMode } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import {
  FlaskConical,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  Printer,
  Download,
  Coffee,
} from "lucide-react";

interface Props {
  schedule: ScheduledClass[];
  inputData: GenerateRequest;
}

export function TimetableGrid({ schedule, inputData }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("section");
  const [selectedId, setSelectedId] = useState<string>("");

  const enriched = enrichSchedule(schedule, inputData);
  const days = [...new Set(inputData.timeslots.map((t) => t.day))];
  const times = [...new Set(inputData.timeslots.map((t) => t.time))].sort();

  // Build filter options based on view mode
  const filterOptions = {
    master: [{ id: "all", label: "Master Grid (All Sections)" }],
    section: inputData.sections.map((s) => ({ id: s.id, label: `Section: ${s.name} (${s.student_count} students)` })),
    faculty: inputData.faculty.map((f) => ({ id: f.id, label: `Faculty: ${f.name}` })),
    room: inputData.rooms.map((r) => ({
      id: r.id,
      label: `Room: ${r.name} (${r.capacity} seats${r.is_lab ? " • Lab" : ""})`,
    })),
  }[viewMode];

  const currentId =
    viewMode === "master"
      ? "all"
      : selectedId || filterOptions[0]?.id || "";

  const filteredClasses = enriched.filter((ec) => {
    if (viewMode === "master") return true;
    if (viewMode === "section") return ec.sectionId === currentId;
    if (viewMode === "faculty") return ec.facultyId === currentId;
    return ec.roomId === currentId;
  });

  const getCell = (day: string, time: string) =>
    filteredClasses.filter((ec) => ec.day === day && ec.time === time);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ["Day", "Time", "Course", "Section", "Faculty", "Room", "IsLab"];
    const rows = enriched.map((c) => [
      `"${c.day}"`,
      `"${c.time}"`,
      `"${c.courseName}"`,
      `"${c.sectionName}"`,
      `"${c.facultyName}"`,
      `"${c.roomName}"`,
      c.isLab ? "Yes" : "No",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_${viewMode}_${currentId || "master"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Top Banner with Flowchart Role Breakdown */}
      <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
            Flowchart Output Stage
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Master Timetable & Filtered Views
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle with 4 flowchart views */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-medium">
            <button
              onClick={() => {
                setViewMode("section");
                setSelectedId("");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                viewMode === "section"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              Student View
            </button>
            <button
              onClick={() => {
                setViewMode("faculty");
                setSelectedId("");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                viewMode === "faculty"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Faculty View
            </button>
            <button
              onClick={() => {
                setViewMode("room");
                setSelectedId("");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                viewMode === "room"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Room View
            </button>
            <button
              onClick={() => {
                setViewMode("master");
                setSelectedId("all");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                viewMode === "master"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Master View
            </button>
          </div>

          {/* Entity selector (hidden if master view) */}
          {viewMode !== "master" && (
            <select
              value={currentId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {filterOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            {filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""} active
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-100">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-b border-r border-slate-100 last:border-r-0 min-w-[170px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time, ti) => (
              <tr key={time} className={cn(ti % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                <td className="px-4 py-3 text-xs font-bold text-slate-500 border-r border-b border-slate-100 whitespace-nowrap bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <span>{time}</span>
                  </div>
                </td>
                {days.map((day) => {
                  const cells = getCell(day, time);
                  return (
                    <td
                      key={`${day}-${time}`}
                      className="px-2 py-2 border-r border-b border-slate-100 last:border-r-0 align-top min-h-[72px]"
                    >
                      <div className="flex flex-col gap-1.5">
                        {cells.map((ec, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded-xl border p-2.5 text-xs leading-tight transition-transform hover:scale-[1.01] shadow-2xs",
                              getCourseColor(ec.courseId)
                            )}
                          >
                            <div className="flex items-center justify-between gap-1 font-bold">
                              <span className="truncate">{ec.courseName}</span>
                              {ec.isLab && (
                                <span className="flex items-center gap-0.5 text-[10px] bg-white/70 px-1.5 py-0.5 rounded-md font-semibold text-purple-800">
                                  <FlaskConical className="w-2.5 h-2.5" /> Lab
                                </span>
                              )}
                            </div>

                            {/* Section info */}
                            {viewMode !== "section" && (
                              <p className="text-[11px] font-semibold opacity-85 mt-1 flex items-center gap-1 truncate">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                {ec.sectionName}
                              </p>
                            )}

                            {/* Faculty info */}
                            {viewMode !== "faculty" && (
                              <p className="text-[10px] opacity-75 mt-0.5 flex items-center gap-1 truncate">
                                <GraduationCap className="w-3 h-3 flex-shrink-0" />
                                {ec.facultyName}
                              </p>
                            )}

                            {/* Room info */}
                            {viewMode !== "room" && (
                              <p className="text-[10px] opacity-75 mt-0.5 flex items-center gap-1 truncate">
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                                {ec.roomName}
                              </p>
                            )}
                          </div>
                        ))}

                        {cells.length === 0 && (
                          <div className="h-10 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 flex items-center justify-center">
                            <span className="text-[10px] text-slate-300 font-mono">Free</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
