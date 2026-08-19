"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import {
  getSemesters,
  getHierarchySummary,
  HierarchySummary,
  HierarchyDepartment,
  HierarchySection,
  HierarchyElectiveGroup,
} from "@/lib/api";
import {
  GraduationCap,
  Building2,
  Users,
  FlaskConical,
  BookOpen,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  Shuffle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HierarchyPanel() {
  const { selectedSemesterId, setSelectedSemesterId, setActiveTab } = useApp();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [filterDept, setFilterDept] = useState<string>("all");

  // Query semesters list
  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: getSemesters,
    staleTime: 60000,
  });

  // Query hierarchy summary for currently selected semester
  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError,
    error,
  } = useQuery({
    queryKey: ["hierarchySummary", selectedSemesterId],
    queryFn: () => getHierarchySummary(selectedSemesterId),
    enabled: !!selectedSemesterId,
    staleTime: 60000,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = summary?.sections?.filter((s) => {
    if (filterDept === "all") return true;
    return s.dept_code === filterDept || s.department_id === filterDept;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Header Card & Semester Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                NEP 2020 Academic Structure
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Institutional Hierarchy Inspector
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Academic Hierarchy & Cohort Model
            </h2>
            <p className="text-sm text-slate-500">
              Inspect departments, sections, laboratory batches, theory courses, and cross-department elective groups.
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
      {isLoadingSummary && (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3 text-sm text-indigo-700 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            Loading academic hierarchy for {selectedSemesterId}…
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Failed to load academic hierarchy</h4>
            <p className="text-xs text-red-700 mt-1">
              {(error as Error)?.message || "Could not connect to the backend hierarchy API."}
            </p>
          </div>
        </div>
      )}

      {/* Main Hierarchy Data Content */}
      {summary && !isLoadingSummary && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Departments</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summary.total_departments || summary.departments?.length || 0}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {summary.departments?.map((d) => d.code).join(", ") || "None"}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Sections</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summary.total_sections}
              </div>
              <div className="text-[11px] text-slate-400">Total cohorts</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lab Batches</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summary.total_lab_batches}
              </div>
              <div className="text-[11px] text-slate-400">A, B, C, D batches</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                <span>Total Students</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summary.total_students}
              </div>
              <div className="text-[11px] text-slate-400">Enrolled cohort</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Total Courses</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summary.total_courses}
              </div>
              <div className="text-[11px] text-slate-400">Curriculum catalog</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Shuffle className="w-3.5 h-3.5 text-rose-500" />
                <span>Elective Groups</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summary.total_elective_groups}
              </div>
              <div className="text-[11px] text-slate-400">Cross-dept baskets</div>
            </div>
          </div>

          {/* Department Breakdown Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Academic Departments
                </h3>
                <p className="text-xs text-slate-500">
                  Participating departments in {summary.semester_name} ({summary.academic_year})
                </p>
              </div>

              {/* Department filter tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterDept("all")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    filterDept === "all"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  All Depts ({summary.sections?.length || 0})
                </button>
                {summary.departments?.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setFilterDept(d.code)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      filterDept === d.code
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {d.code} ({d.section_count})
                  </button>
                ))}
              </div>
            </div>

            {/* Department cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {summary.departments?.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800">
                      {dept.code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {dept.student_count} Students
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{dept.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dept.section_count} sections in this semester
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dept.sections?.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-200 text-slate-700 rounded-md shadow-2xs"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section & Lab Batch Detailed View */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Sections & Laboratory Batches
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredSections.length} sections with their 4-batch practical splits & assigned courses
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {filteredSections.map((sec) => {
                const isExpanded = expandedSections[sec.id] !== false; // default expanded
                return (
                  <div
                    key={sec.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                  >
                    {/* Section Header */}
                    <div
                      onClick={() => toggleSection(sec.id)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          {sec.dept_code || sec.section_code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              Section {sec.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                              {sec.dept_code} Dept
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {sec.student_count} Students • {sec.batch_count || sec.lab_batches?.length || 0} Lab Batches • {sec.assignments?.length || 0} Assigned Courses
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span>{isExpanded ? "Collapse" : "Expand Details"}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Section Expanded Details */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 border-t border-slate-200 bg-white">
                        {/* Lab Batches Strip */}
                        {sec.lab_batches && sec.lab_batches.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                              Laboratory Batches (Parallel Tracks)
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {sec.lab_batches.map((b) => (
                                <div
                                  key={b.id}
                                  className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between"
                                >
                                  <div>
                                    <span className="text-xs font-black text-emerald-900 block">
                                      Batch {b.batch_code}
                                    </span>
                                    <span className="text-[11px] text-emerald-700">
                                      {sec.name}-{b.batch_code}
                                    </span>
                                  </div>
                                  <span className="px-2 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 shadow-2xs">
                                    {b.student_count} studs
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assigned Courses Table */}
                        {sec.assignments && sec.assignments.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              Course Curriculum & Faculty Assignments
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th className="py-2.5 px-3">Course</th>
                                    <th className="py-2.5 px-3">Code</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3">Weekly Periods</th>
                                    <th className="py-2.5 px-3">Faculty</th>
                                    <th className="py-2.5 px-3">Special Track</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {sec.assignments.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/60">
                                      <td className="py-2 px-3 font-semibold text-slate-800">
                                        {a.course_name}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                        {a.course_code || "—"}
                                      </td>
                                      <td className="py-2 px-3">
                                        {a.requires_lab ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            Practical (2-hr Lab)
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                            Theory Lecture
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 font-medium text-slate-700">
                                        {a.weekly_periods} periods/wk
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        {a.faculty_name}
                                      </td>
                                      <td className="py-2 px-3">
                                        {a.elective_group_id ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                            Elective Option
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-[11px]">Core Section Course</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Elective Groups View */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-purple-600" />
                Cross-Department Elective Groups
              </h3>
              <p className="text-xs text-slate-500">
                NEP 2020 multi-disciplinary baskets synchronized across departments to the exact same timeslot
              </p>
            </div>

            {summary.elective_groups && summary.elective_groups.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {summary.elective_groups.map((eg) => (
                  <div
                    key={eg.id}
                    className="border border-purple-200 bg-purple-50/20 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
                          {eg.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{eg.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-purple-200 text-purple-700">
                        Cap: {eg.capacity} seats
                      </span>
                    </div>

                    {/* Synchronized Options List */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        Synchronized Course Options
                      </div>
                      <div className="space-y-2">
                        {eg.options?.map((opt) => (
                          <div
                            key={opt.assignment_id}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {opt.course_name}
                                </span>
                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  {opt.course_code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Dept: <span className="font-semibold text-slate-700">{opt.dept_code}</span> • Faculty: <span className="font-semibold text-slate-700">{opt.faculty_name}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md">
                                {opt.weekly_periods} hrs/wk
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400">
                  No elective groups registered for {summary.semester_name}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
