"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import {
  getSemesters,
  getSemesterFaculty,
  FacultyDetail,
} from "@/lib/api";
import {
  UserCheck,
  Building2,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Clock,
  FlaskConical,
  GraduationCap,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FacultyViewPanel() {
  const { selectedSemesterId, setSelectedSemesterId, setActiveTab } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [expandedFaculty, setExpandedFaculty] = useState<Record<string, boolean>>({});

  // Query semesters list
  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: getSemesters,
    staleTime: 60000,
  });

  // Query faculty details for the selected semester
  const {
    data: facultyData,
    isLoading: isLoadingFaculty,
    isError,
    error,
  } = useQuery({
    queryKey: ["semesterFaculty", selectedSemesterId],
    queryFn: () => getSemesterFaculty(selectedSemesterId),
    enabled: !!selectedSemesterId,
    staleTime: 60000,
  });

  const facultyList: FacultyDetail[] = facultyData?.faculty || [];

  const toggleFaculty = (id: string) => {
    setExpandedFaculty((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter faculty by department and search query
  const filteredFaculty = facultyList.filter((f) => {
    const matchesDept = selectedDept === "all" || f.dept_code === selectedDept;
    const matchesSearch =
      searchQuery.trim() === "" ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.dept_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.assigned_courses.some((c) =>
        c.course_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesDept && matchesSearch;
  });

  const uniqueDepts = Array.from(new Set(facultyList.map((f) => f.dept_code))).filter(Boolean);
  const totalAllocatedPeriods = facultyList.reduce((acc, f) => acc + (f.has_schedule ? f.schedule.length : f.total_weekly_periods), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card & Semester Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Faculty Teaching Allocation
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Read-Only Inspector
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Faculty Workload & Academic Assignments
            </h2>
            <p className="text-sm text-slate-500">
              Inspect course allocations, section assignments, and scheduled teaching periods for academic staff in {selectedSemesterId}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("generate")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Go to Schedule Generator
            </button>
          </div>
        </div>

        {/* Semester Selection Bar */}
        <div className="pt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Select Academic Semester
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {isLoadingSemesters ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading semesters…
              </div>
            ) : (
              semesters.map((sem) => (
                <button
                  key={sem.id}
                  onClick={() => setSelectedSemesterId(sem.id)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                    selectedSemesterId === sem.id
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  {sem.name}
                  {sem.id === "SEM5" && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      MVP Active
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingFaculty && (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3 text-sm text-indigo-700 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            Loading faculty assignments for {selectedSemesterId}…
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Failed to load faculty information</h4>
            <p className="text-xs text-red-700 mt-1">
              {(error as Error)?.message || "Could not connect to backend faculty API."}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoadingFaculty && !isError && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Assigned Faculty</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {facultyData?.total_assigned_faculty ?? facultyList.length}
              </div>
              <div className="text-[11px] text-slate-400">
                Out of {facultyData?.total_institutional_faculty ?? 18} university faculty
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Departments</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {uniqueDepts.length}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {uniqueDepts.join(", ") || "None"}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Total Teaching Hours</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {totalAllocatedPeriods}
              </div>
              <div className="text-[11px] text-slate-400">Allocated weekly periods</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Avg Workload</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {facultyList.length > 0
                  ? (totalAllocatedPeriods / facultyList.length).toFixed(1)
                  : "0"}
              </div>
              <div className="text-[11px] text-slate-400">Periods / faculty member</div>
            </div>
          </div>

          {/* Search & Department Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search faculty name, course, or department…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Department Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
              <button
                onClick={() => setSelectedDept("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  selectedDept === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                All Departments ({facultyList.length})
              </button>
              {uniqueDepts.map((code) => {
                const count = facultyList.filter((f) => f.dept_code === code).length;
                return (
                  <button
                    key={code}
                    onClick={() => setSelectedDept(code)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                      selectedDept === code
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {code} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Faculty Cards List */}
          {filteredFaculty.length > 0 ? (
            <div className="space-y-4">
              {filteredFaculty.map((fac) => {
                const isExpanded = expandedFaculty[fac.id] !== false; // default expanded
                return (
                  <div
                    key={fac.id}
                    className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden"
                  >
                    {/* Faculty Header Strip */}
                    <div
                      onClick={() => toggleFaculty(fac.id)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                          {fac.dept_code || "FAC"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">{fac.name}</h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              {fac.dept_code} Department
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ID: <span className="font-mono">{fac.id}</span> • {fac.assigned_courses.length} Courses • {fac.assigned_sections.length} Sections
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 block">
                            {fac.has_schedule ? fac.schedule.length : fac.total_weekly_periods} periods / week
                          </span>
                          <span className="text-[11px] text-slate-400">Teaching allocation</span>
                        </div>
                        <div className="text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Faculty Expanded Body */}
                    {isExpanded && (
                      <div className="p-5 space-y-5 border-t border-slate-200 bg-white">
                        {/* Course & Section Chips */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Assigned Courses
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {fac.assigned_courses.map((c) => (
                                <span
                                  key={c.course_id}
                                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
                                >
                                  <BookOpen className="w-3 h-3 text-indigo-500" />
                                  {c.course_name}
                                  {c.requires_lab && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                      Lab
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Assigned Cohort Sections
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {fac.assigned_sections.map((s) => (
                                <span
                                  key={s.section_id}
                                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Building2 className="w-3 h-3 text-blue-600" />
                                  Section {s.section_name} ({s.dept_code})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Teaching Assignments Table */}
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Class Load Breakdown
                          </span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="py-2.5 px-3">Assignment ID</th>
                                  <th className="py-2.5 px-3">Course</th>
                                  <th className="py-2.5 px-3">Section</th>
                                  <th className="py-2.5 px-3">Batch</th>
                                  <th className="py-2.5 px-3">Type</th>
                                  <th className="py-2.5 px-3">Weekly Hours</th>
                                  <th className="py-2.5 px-3">Track</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {fac.teaching_assignments.map((a) => (
                                  <tr key={a.id} className="hover:bg-slate-50/60">
                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                      {a.id}
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-slate-800">
                                      {a.course_name}
                                    </td>
                                    <td className="py-2 px-3 font-medium text-slate-700">
                                      Section {a.section_name}
                                    </td>
                                    <td className="py-2 px-3">
                                      {(() => {
                                        if (a.batch_code) {
                                          return (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                              Batch {a.batch_code}
                                            </span>
                                          );
                                        }
                                        
                                        const scheduledBatches = fac.has_schedule 
                                          ? Array.from(new Set(
                                              fac.schedule
                                                .filter(sc => sc.course_name === a.course_name && sc.section_name === a.section_name && sc.batch_code)
                                                .map(sc => sc.batch_code)
                                            )).sort()
                                          : [];
                                          
                                        if (scheduledBatches.length > 0) {
                                          return (
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-[10px]">
                                              {scheduledBatches.length} Lab Batches ({scheduledBatches.join(', ')})
                                            </span>
                                          );
                                        }

                                        return <span className="text-slate-400 text-[11px]">Whole Section</span>;
                                      })()}
                                    </td>
                                    <td className="py-2 px-3">
                                      {a.requires_lab ? (
                                        <span className="text-emerald-700 font-semibold">2-Hr Lab</span>
                                      ) : (
                                        <span className="text-blue-700 font-semibold">Theory</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-slate-800">
                                      {a.weekly_periods} periods
                                    </td>
                                    <td className="py-2 px-3">
                                      {a.elective_group_id ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                          Elective ({a.elective_group_id})
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">Core Section</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Scheduled Classes Section (if timetable active) */}
                        {fac.has_schedule ? (
                          <div className="bg-emerald-50/30 border border-emerald-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              Active Timetable Schedule ({fac.schedule.length} periods scheduled)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {fac.schedule.map((sc, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white border border-emerald-200/80 rounded-xl p-3 shadow-2xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">
                                      {sc.day} {sc.time}
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                      {sc.room_name}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-emerald-900 truncate">
                                    {sc.course_name}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Section {sc.section_name} {sc.batch_code ? `• Batch ${sc.batch_code}` : ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>
                              Scheduled timetable periods will appear here after a timetable is generated for {selectedSemesterId}.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No faculty records found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? `No faculty match search term "${searchQuery}".`
                  : `No faculty allocations exist for ${selectedSemesterId}.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
